import fs from "fs";
import os from "os";
import path from "path";
import {
  AgencyStateSnapshot,
  AnnotationComment,
  ApprovalReceipt,
  AssetVersion,
  AuditEvent,
  Client,
  Deliverable,
  Project,
  Role,
  SocialScheduleConfig,
  TeamMember,
} from "@/types/agency";
import { createInitialAgencySnapshot } from "@/lib/seed-data";
import {
  computeAssetSha256,
  createApprovalReceipt,
} from "@/lib/crypto-receipts";
import { publishToWorkQueue } from "@/lib/gcp-pubsub";
import { synthesizeClientFeedbackToActions } from "@/lib/gemini-copilot";
import {
  getFirebaseAdminDb,
  isFirebaseAdminConfigured,
  writeGcpStructuredLog,
} from "@/lib/firebase-admin";
import { withResilientFallback } from "@/lib/resilience";

const LOCAL_DATA_FILE_PATH = path.join(process.cwd(), ".agencyos-runtime-db.json");
const TMP_DATA_FILE_PATH = path.join(os.tmpdir(), "agencyos-runtime-db.json");

let memorySnapshot: AgencyStateSnapshot | null = null;

function loadLocalSnapshot(): AgencyStateSnapshot {
  if (memorySnapshot) {
    return memorySnapshot;
  }
  for (const candidatePath of [LOCAL_DATA_FILE_PATH, TMP_DATA_FILE_PATH]) {
    try {
      if (fs.existsSync(candidatePath)) {
        const raw = fs.readFileSync(candidatePath, "utf-8");
        const parsed = JSON.parse(raw) as AgencyStateSnapshot;
        if (parsed && Array.isArray(parsed.deliverables)) {
          memorySnapshot = parsed;
          return parsed;
        }
      }
    } catch {
      // Continue to next candidate or seed snapshot
    }
  }
  memorySnapshot = createInitialAgencySnapshot();
  saveLocalSnapshot(memorySnapshot);
  return memorySnapshot;
}

function saveLocalSnapshot(snapshot: AgencyStateSnapshot): void {
  memorySnapshot = snapshot;
  const serialized = JSON.stringify(snapshot, null, 2);
  try {
    fs.writeFileSync(LOCAL_DATA_FILE_PATH, serialized, "utf-8");
  } catch {
    try {
      fs.writeFileSync(TMP_DATA_FILE_PATH, serialized, "utf-8");
    } catch {
      // Non-fatal in strictly ephemeral environments; memorySnapshot remains active
    }
  }
}

export async function getAgencySnapshot(): Promise<{
  snapshot: AgencyStateSnapshot;
  provider: "firebase_gcp_cloud" | "resilient_local_engine";
  fallbackUsed: boolean;
  latencyMs: number;
}> {
  const { result, provider, fallbackUsed, latencyMs } =
    await withResilientFallback<AgencyStateSnapshot>({
      service: "firestore_db",
      operationName: "getAgencySnapshot",
      isCloudConfigured: isFirebaseAdminConfigured,
      primaryFn: async () => {
        const db = getFirebaseAdminDb();
        if (!db) throw new Error("Firestore Admin DB not initialized");
        const doc = await db.collection("agencyos_state").doc("master").get();
        if (doc.exists) {
          const data = doc.data() as AgencyStateSnapshot;
          saveLocalSnapshot(data);
          return data;
        }
        const initial = loadLocalSnapshot();
        await db.collection("agencyos_state").doc("master").set(initial);
        return initial;
      },
      fallbackFn: () => loadLocalSnapshot(),
    });

  return { snapshot: result, provider, fallbackUsed, latencyMs };
}

export async function persistAgencySnapshot(
  snapshot: AgencyStateSnapshot
): Promise<{
  provider: "firebase_gcp_cloud" | "resilient_local_engine";
  fallbackUsed: boolean;
}> {
  saveLocalSnapshot(snapshot);

  const { provider, fallbackUsed } = await withResilientFallback<boolean>({
    service: "firestore_db",
    operationName: "persistAgencySnapshot",
    isCloudConfigured: isFirebaseAdminConfigured,
    primaryFn: async () => {
      const db = getFirebaseAdminDb();
      if (!db) throw new Error("Firestore Admin DB unavailable");
      await db.collection("agencyos_state").doc("master").set(snapshot);
      return true;
    },
    fallbackFn: () => true,
  });

  return { provider, fallbackUsed };
}

export async function recordDeliverableDecision(params: {
  deliverableId?: string;
  shareToken?: string;
  decision: "approved" | "changes_requested" | "rejected";
  reviewerName: string;
  reviewerEmail: string;
  reviewerRole: Role;
  comment: string;
  pinX?: number;
  pinY?: number;
  ipAddress?: string;
  userAgent?: string;
}): Promise<{
  deliverable: Deliverable;
  receipt: ApprovalReceipt;
  aiActionCount: number;
}> {
  const { snapshot } = await getAgencySnapshot();
  const deliverable = snapshot.deliverables.find(
    (d) =>
      (params.deliverableId && d.id === params.deliverableId) ||
      (params.shareToken && d.shareToken === params.shareToken)
  );

  if (!deliverable) {
    throw new Error("Deliverable not found or invalid review link token");
  }

  const currentVerObj =
    deliverable.versions.find(
      (v) => v.versionNumber === deliverable.currentVersion
    ) || deliverable.versions[deliverable.versions.length - 1];

  const receipt = createApprovalReceipt({
    deliverable,
    version: currentVerObj,
    decision: params.decision,
    reviewerName: params.reviewerName,
    reviewerEmail: params.reviewerEmail,
    reviewerRole: params.reviewerRole,
    comment: params.comment,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  });

  currentVerObj.status =
    params.decision === "approved"
      ? "approved"
      : params.decision === "rejected"
      ? "rejected"
      : "changes_requested";
  currentVerObj.receiptId = receipt.id;

  let aiItems: AnnotationComment["aiActionItems"] = [];
  if (
    params.comment.trim().length > 0 &&
    params.decision !== "approved"
  ) {
    const synth = await synthesizeClientFeedbackToActions({
      deliverableTitle: deliverable.title,
      comment: params.comment,
      versionNumber: currentVerObj.versionNumber,
    });
    aiItems = synth.items;
  }

  if (params.comment.trim().length > 0) {
    const newComment: AnnotationComment = {
      id: `cmt_${Date.now().toString(36)}`,
      deliverableId: deliverable.id,
      versionId: currentVerObj.id,
      versionNumber: currentVerObj.versionNumber,
      authorName: params.reviewerName,
      authorEmail: params.reviewerEmail,
      authorRole: params.reviewerRole,
      content: params.comment,
      createdAt: receipt.timestamp,
      pinX: params.pinX,
      pinY: params.pinY,
      resolved: params.decision === "approved",
      aiActionItems: aiItems,
    };
    deliverable.comments.unshift(newComment);
  }

  deliverable.receipts.unshift(receipt);
  deliverable.updatedAt = receipt.timestamp;

  if (params.decision === "approved") {
    deliverable.status = "approved";
    deliverable.requiresReapproval = false;
    deliverable.previousApprovedVersion = currentVerObj.versionNumber;
    deliverable.workflowStageId = "stg_approved_delivery";

    // Automatically unlock any linked milestone invoice
    const linkedInv = snapshot.invoices.find(
      (inv) => inv.linkedDeliverableId === deliverable.id
    );
    if (linkedInv && linkedInv.status === "pending_approval_release") {
      linkedInv.status = "sent";
      linkedInv.linkedReceiptId = receipt.id;
    }
  } else {
    deliverable.status = "changes_requested";
    deliverable.revisionCount += 1;
    deliverable.workflowStageId = "stg_internal_qa";
  }

  // Publish Pub/Sub notification & approval event
  const pubsubJob = await publishToWorkQueue({
    orgId: deliverable.orgId,
    topic: "agencyos-approval-events",
    eventType:
      params.decision === "approved"
        ? "CLIENT_APPROVED_VERSION"
        : "CLIENT_REQUESTED_CHANGES",
    recipient: deliverable.ownerEmail,
    subject: `[${params.decision.toUpperCase()}] ${deliverable.title} (v${
      currentVerObj.versionNumber
    }) — Receipt ${receipt.id}`,
    payload: {
      deliverableId: deliverable.id,
      versionNumber: currentVerObj.versionNumber,
      receiptId: receipt.id,
      fileSha256: currentVerObj.fileSha256,
      reviewerEmail: params.reviewerEmail,
    },
  });
  snapshot.pubsubJobs.unshift(pubsubJob);

  const auditEvent: AuditEvent = {
    id: `aud_${Date.now().toString(36)}`,
    orgId: deliverable.orgId,
    actorName: params.reviewerName,
    actorEmail: params.reviewerEmail,
    actorRole: params.reviewerRole,
    action:
      params.decision === "approved"
        ? "CRYPTOGRAPHIC_APPROVAL_RECEIPT_ISSUED"
        : "CHANGES_REQUESTED_WITH_ACTION_ITEMS",
    targetType: "approval_receipt",
    targetId: receipt.id,
    targetTitle: `${deliverable.title} (v${currentVerObj.versionNumber}.0)`,
    metadata: {
      decision: params.decision,
      versionNumber: currentVerObj.versionNumber,
      fileSha256: currentVerObj.fileSha256.slice(0, 16),
      aiTasksExtracted: aiItems.length,
    },
    timestamp: receipt.timestamp,
    severity: params.decision === "approved" ? "success" : "warning",
  };
  snapshot.auditEvents.unshift(auditEvent);

  await writeGcpStructuredLog({
    severity: params.decision === "approved" ? "INFO" : "WARNING",
    event: auditEvent.action,
    orgId: deliverable.orgId,
    metadata: auditEvent.metadata,
  });

  await persistAgencySnapshot(snapshot);

  return {
    deliverable,
    receipt,
    aiActionCount: aiItems.length,
  };
}

/**
 * Uploads a new version of an asset.
 * Enforces Rule C: "Each approval is attached to a specific asset version.
 * If a designer changes the approved file, the system requires a new approval."
 */
export async function uploadDeliverableVersion(params: {
  deliverableId: string;
  label: string;
  fileName: string;
  fileUrl: string;
  fileSizeMb: number;
  dimensions: string;
  changeSummary: string;
  uploadedBy: string;
  uploaderEmail: string;
  uploaderRole: Role;
}): Promise<{
  deliverable: Deliverable;
  newVersion: AssetVersion;
  invalidatedPreviousApproval: boolean;
}> {
  const { snapshot } = await getAgencySnapshot();
  const deliverable = snapshot.deliverables.find(
    (d) => d.id === params.deliverableId
  );

  if (!deliverable) {
    throw new Error("Deliverable not found");
  }

  const nextVersionNumber = deliverable.currentVersion + 1;
  const fileSha256 = computeAssetSha256(
    params.fileName,
    nextVersionNumber,
    params.fileSizeMb,
    `${deliverable.id}-${Date.now()}`
  );

  const wasPreviouslyApproved =
    deliverable.status === "approved" ||
    deliverable.receipts.some((r) => r.decision === "approved");

  // Mark existing versions as superseded
  for (const v of deliverable.versions) {
    if (v.status === "approved" || v.status === "pending_review") {
      v.status = "superseded";
    }
  }

  // Mark any previously active receipts as superseded by this new version
  for (const r of deliverable.receipts) {
    if (r.supersededByVersion === null) {
      r.supersededByVersion = nextVersionNumber;
    }
  }

  const now = new Date().toISOString();
  const newVersion: AssetVersion = {
    id: `ver_${deliverable.id}_v${nextVersionNumber}_${Date.now()
      .toString(36)
      .slice(-3)}`,
    versionNumber: nextVersionNumber,
    label: params.label || `v${nextVersionNumber}.0 — Updated Asset`,
    fileUrl: params.fileUrl || "/assets/deliverables/lumina-skincare-v2.jpg",
    fileName: params.fileName,
    fileSizeMb: params.fileSizeMb,
    dimensions: params.dimensions || "2400 x 3000 px",
    fileSha256,
    uploadedBy: params.uploadedBy,
    uploadedAt: now,
    changeSummary: params.changeSummary,
    status: "pending_review",
    receiptId: null,
  };

  deliverable.versions.push(newVersion);
  deliverable.currentVersion = nextVersionNumber;
  deliverable.status = "client_review";
  deliverable.workflowStageId = "stg_client_portal";
  deliverable.updatedAt = now;

  if (wasPreviouslyApproved) {
    deliverable.requiresReapproval = true;
    // Pause any linked invoice that hasn't been paid yet
    const inv = snapshot.invoices.find(
      (i) => i.linkedDeliverableId === deliverable.id && i.status === "sent"
    );
    if (inv) {
      inv.status = "pending_approval_release";
    }
  }

  const pubsubJob = await publishToWorkQueue({
    orgId: deliverable.orgId,
    topic: "agencyos-email-notifications",
    eventType: wasPreviouslyApproved
      ? "APPROVED_FILE_MODIFIED_REAPPROVAL_REQUIRED"
      : "NEW_VERSION_UPLOADED",
    recipient: deliverable.clientName,
    subject: wasPreviouslyApproved
      ? `[Re-Approval Required] ${deliverable.title} modified in v${nextVersionNumber}.0`
      : `[New Version v${nextVersionNumber}.0] ${deliverable.title} ready for review`,
    payload: {
      deliverableId: deliverable.id,
      versionNumber: nextVersionNumber,
      fileSha256,
      wasPreviouslyApproved,
    },
  });
  snapshot.pubsubJobs.unshift(pubsubJob);

  const audit: AuditEvent = {
    id: `aud_${Date.now().toString(36)}`,
    orgId: deliverable.orgId,
    actorName: params.uploadedBy,
    actorEmail: params.uploaderEmail,
    actorRole: params.uploaderRole,
    action: wasPreviouslyApproved
      ? "VERSION_UPLOAD_INVALIDATED_PREVIOUS_APPROVAL"
      : "ASSET_VERSION_UPLOADED",
    targetType: "version",
    targetId: newVersion.id,
    targetTitle: `${deliverable.title} (v${nextVersionNumber}.0)`,
    metadata: {
      versionNumber: nextVersionNumber,
      fileSha256: fileSha256.slice(0, 16),
      requiresReapproval: wasPreviouslyApproved,
    },
    timestamp: now,
    severity: wasPreviouslyApproved ? "warning" : "info",
  };
  snapshot.auditEvents.unshift(audit);

  await persistAgencySnapshot(snapshot);

  return {
    deliverable,
    newVersion,
    invalidatedPreviousApproval: wasPreviouslyApproved,
  };
}

export async function scheduleDeliverableSocialPost(params: {
  deliverableId: string;
  platform: "instagram" | "linkedin" | "tiktok";
  handle: string;
  caption: string;
  hashtags: string[];
  scheduledFor: string;
  actorName: string;
  actorEmail: string;
}): Promise<Deliverable> {
  const { snapshot } = await getAgencySnapshot();
  const deliverable = snapshot.deliverables.find(
    (d) => d.id === params.deliverableId
  );
  if (!deliverable) {
    throw new Error("Deliverable not found");
  }

  const schedule: SocialScheduleConfig = {
    platform: params.platform,
    handle: params.handle,
    caption: params.caption,
    hashtags: params.hashtags,
    scheduledFor: params.scheduledFor,
    status: "queued_in_pubsub",
    externalPostId: `ig_pub_${Date.now().toString(36)}`,
  };

  deliverable.socialSchedule = schedule;
  deliverable.updatedAt = new Date().toISOString();

  const job = await publishToWorkQueue({
    orgId: deliverable.orgId,
    topic: "agencyos-social-publishing",
    eventType: "DIRECT_SOCIAL_PUBLISH_QUEUED",
    recipient: `${params.platform.toUpperCase()} (${params.handle})`,
    subject: `Scheduled ${deliverable.title} (v${deliverable.currentVersion}) to ${params.platform}`,
    payload: {
      deliverableId: deliverable.id,
      platform: params.platform,
      scheduledFor: params.scheduledFor,
    },
  });
  snapshot.pubsubJobs.unshift(job);

  snapshot.auditEvents.unshift({
    id: `aud_${Date.now().toString(36)}`,
    orgId: deliverable.orgId,
    actorName: params.actorName,
    actorEmail: params.actorEmail,
    actorRole: "manager",
    action: "SOCIAL_PUBLISH_QUEUED_TO_PUBSUB",
    targetType: "social_publish",
    targetId: deliverable.id,
    targetTitle: `${deliverable.title} -> ${params.platform.toUpperCase()}`,
    metadata: {
      platform: params.platform,
      handle: params.handle,
      versionLocked: deliverable.currentVersion,
    },
    timestamp: new Date().toISOString(),
    severity: "success",
  });

  await persistAgencySnapshot(snapshot);
  return deliverable;
}
