import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAgencySnapshot,
  persistAgencySnapshot,
  scheduleDeliverableSocialPost,
} from "@/lib/server-db";
import { createApiError, createApiResponse } from "@/lib/resilience";
import { computeAssetSha256 } from "@/lib/crypto-receipts";
import { publishToWorkQueue } from "@/lib/gcp-pubsub";
import { createInitialAgencySnapshot } from "@/lib/seed-data";
import { Deliverable, Organization, WorkflowStage } from "@/types/agency";

const ActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CREATE_DELIVERABLE"),
    orgId: z.string(),
    clientId: z.string(),
    projectId: z.string(),
    title: z.string().min(2),
    description: z.string(),
    channel: z.enum([
      "Instagram Feed",
      "Instagram Reels",
      "TikTok",
      "LinkedIn",
      "Packaging & Print",
      "Brand Guidelines",
      "Web Campaign",
    ]),
    assetType: z.enum(["image", "video", "carousel", "pdf_deck", "copy_doc"]),
    priority: z.enum(["urgent", "high", "medium", "low"]),
    deadline: z.string(),
    fileUrl: z.string().optional(),
    fileName: z.string().optional(),
    invoiceMilestoneUsd: z.number().optional(),
    actorName: z.string(),
    actorEmail: z.string(),
  }),
  z.object({
    action: z.literal("CREATE_CLIENT_AND_PROJECT"),
    orgId: z.string(),
    clientName: z.string().min(2),
    industry: z.string(),
    contactName: z.string(),
    contactEmail: z.string().email(),
    retainerMonthlyUsd: z.number(),
    projectName: z.string().min(2),
    projectCode: z.string(),
    actorName: z.string(),
    actorEmail: z.string(),
  }),
  z.object({
    action: z.literal("INVITE_TEAM_MEMBER"),
    orgId: z.string(),
    name: z.string().min(2),
    email: z.string().email(),
    role: z.enum(["owner", "manager", "designer", "client"]),
    title: z.string(),
    actorName: z.string(),
    actorEmail: z.string(),
  }),
  z.object({
    action: z.literal("CREATE_ORGANIZATION"),
    name: z.string().min(2),
    domain: z.string().min(3),
    planTier: z.enum(["starter", "growth", "enterprise"]),
    ownerName: z.string(),
    ownerEmail: z.string().email(),
  }),
  z.object({
    action: z.literal("SEND_APPROVAL_REMINDER"),
    deliverableId: z.string(),
    actorName: z.string(),
    actorEmail: z.string(),
  }),
  z.object({
    action: z.literal("TOGGLE_AI_TASK"),
    deliverableId: z.string(),
    commentId: z.string(),
    taskId: z.string(),
  }),
  z.object({
    action: z.literal("UPDATE_WORKFLOW_STAGES"),
    stages: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        roleRequired: z.enum(["owner", "manager", "designer", "client"]),
        slaHours: z.number(),
        autoNotifyClient: z.boolean(),
        requireSha256Receipt: z.boolean(),
        aiGuardrailCheck: z.boolean(),
        order: z.number(),
      })
    ),
  }),
  z.object({
    action: z.literal("UPDATE_BILLING_PLAN"),
    orgId: z.string(),
    planTier: z.enum(["starter", "growth", "enterprise"]),
    actorName: z.string(),
    actorEmail: z.string(),
  }),
  z.object({
    action: z.literal("SCHEDULE_SOCIAL_PUBLISH"),
    deliverableId: z.string(),
    platform: z.enum(["instagram", "linkedin", "tiktok"]),
    handle: z.string(),
    caption: z.string(),
    hashtags: z.array(z.string()),
    scheduledFor: z.string(),
    actorName: z.string(),
    actorEmail: z.string(),
  }),
  z.object({
    action: z.literal("RESET_DEMO_DATA"),
  }),
]);

export async function GET() {
  try {
    const { snapshot, provider, fallbackUsed, latencyMs } =
      await getAgencySnapshot();
    return NextResponse.json(
      createApiResponse({
        data: snapshot,
        provider,
        fallbackUsed,
        latencyMs,
      })
    );
  } catch (err) {
    return NextResponse.json(
      createApiError({
        code: "STATE_FETCH_FAILED",
        message:
          err instanceof Error ? err.message : "Failed to load AgencyOS state",
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  try {
    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        createApiError({
          code: "VALIDATION_ERROR",
          message: "Invalid request payload",
          details: parsed.error.issues.map((i) => i.message).join("; "),
        }),
        { status: 400 }
      );
    }

    const payload = parsed.data;
    if (payload.action === "RESET_DEMO_DATA") {
      const freshSnapshot = createInitialAgencySnapshot();
      const { provider, fallbackUsed } = await persistAgencySnapshot(
        freshSnapshot
      );
      return NextResponse.json(
        createApiResponse({
          data: freshSnapshot,
          provider,
          fallbackUsed,
          latencyMs: Date.now() - start,
        })
      );
    }

    const { snapshot } = await getAgencySnapshot();

    if (payload.action === "SCHEDULE_SOCIAL_PUBLISH") {
      await scheduleDeliverableSocialPost(payload);
      const refreshed = await getAgencySnapshot();
      return NextResponse.json(
        createApiResponse({
          data: refreshed.snapshot,
          provider: refreshed.provider,
          fallbackUsed: refreshed.fallbackUsed,
          latencyMs: Date.now() - start,
        })
      );
    }

    if (payload.action === "CREATE_DELIVERABLE") {
      const client = snapshot.clients.find((c) => c.id === payload.clientId);
      const project = snapshot.projects.find((p) => p.id === payload.projectId);
      const delId = `del_${Date.now().toString(36)}`;
      const fileName = payload.fileName || "campaign-key-visual-v1.jpg";
      const fileUrl =
        payload.fileUrl || "/assets/deliverables/lumina-skincare-v2.jpg";
      const sha = computeAssetSha256(fileName, 1, 6.8, delId);
      const now = new Date().toISOString();

      const newDel: Deliverable = {
        id: delId,
        orgId: payload.orgId,
        clientId: payload.clientId,
        clientName: client?.name || "Agency Client",
        projectId: payload.projectId,
        projectName: project?.name || "Brand Campaign",
        title: payload.title,
        description: payload.description,
        channel: payload.channel,
        assetType: payload.assetType,
        status: "client_review",
        priority: payload.priority,
        ownerId: "usr_claire",
        ownerName: payload.actorName,
        ownerEmail: payload.actorEmail,
        deadline: payload.deadline,
        currentVersion: 1,
        requiresReapproval: false,
        previousApprovedVersion: null,
        shareToken: `tok_${Date.now().toString(36)}`,
        shareLinkActive: true,
        shareLinkExpiresAt: "2026-12-31T00:00:00.000Z",
        turnaroundHours: 1.0,
        revisionCount: 0,
        workflowStageId: "stg_client_portal",
        invoiceMilestoneUsd: payload.invoiceMilestoneUsd || 3500,
        versions: [
          {
            id: `ver_${delId}_v1`,
            versionNumber: 1,
            label: "v1.0 — Initial Creative Submission",
            fileUrl,
            fileName,
            fileSizeMb: 6.8,
            dimensions: "2400 x 3000 px",
            fileSha256: sha,
            uploadedBy: payload.actorName,
            uploadedAt: now,
            changeSummary: "Initial deliverable upload with SHA-256 fingerprint.",
            status: "pending_review",
            receiptId: null,
          },
        ],
        comments: [],
        receipts: [],
        updatedAt: now,
      };

      snapshot.deliverables.unshift(newDel);

      const job = await publishToWorkQueue({
        orgId: payload.orgId,
        topic: "agencyos-email-notifications",
        eventType: "DELIVERABLE_PORTAL_LINK_CREATED",
        recipient: client?.contactEmail || "client@brand.co",
        subject: `[Review Requested] ${payload.title} (v1.0) is ready in your Client Portal`,
        payload: {
          deliverableId: newDel.id,
          shareToken: newDel.shareToken,
          fileSha256: sha,
        },
      });
      snapshot.pubsubJobs.unshift(job);

      snapshot.auditEvents.unshift({
        id: `aud_${Date.now().toString(36)}`,
        orgId: payload.orgId,
        actorName: payload.actorName,
        actorEmail: payload.actorEmail,
        actorRole: "manager",
        action: "DELIVERABLE_CREATED_AND_LINK_ISSUED",
        targetType: "deliverable",
        targetId: newDel.id,
        targetTitle: newDel.title,
        metadata: {
          shareToken: newDel.shareToken,
          fileSha256: sha.slice(0, 16),
        },
        timestamp: now,
        severity: "info",
      });
    } else if (payload.action === "CREATE_CLIENT_AND_PROJECT") {
      const clientId = `cli_${Date.now().toString(36)}`;
      const projectId = `prj_${Date.now().toString(36)}`;
      const initials = payload.clientName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      snapshot.clients.unshift({
        id: clientId,
        orgId: payload.orgId,
        name: payload.clientName,
        industry: payload.industry,
        contactName: payload.contactName,
        contactEmail: payload.contactEmail,
        contactTitle: "Brand Stakeholder",
        logoInitials: initials || "CL",
        accentColor: "#0F172A",
        avgResponseTimeHours: 12.0,
        totalApproved: 0,
        pendingApprovalsCount: 0,
        revisionRateAvg: 1.0,
        retainerMonthlyUsd: payload.retainerMonthlyUsd,
        createdAt: new Date().toISOString(),
      });

      snapshot.projects.unshift({
        id: projectId,
        orgId: payload.orgId,
        clientId,
        clientName: payload.clientName,
        name: payload.projectName,
        code: payload.projectCode.toUpperCase(),
        status: "active",
        dueDate: "2026-11-30T18:00:00.000Z",
        deliverableCount: 0,
      });

      snapshot.auditEvents.unshift({
        id: `aud_${Date.now().toString(36)}`,
        orgId: payload.orgId,
        actorName: payload.actorName,
        actorEmail: payload.actorEmail,
        actorRole: "owner",
        action: "CLIENT_AND_PROJECT_INITIALIZED",
        targetType: "organization",
        targetId: clientId,
        targetTitle: `${payload.clientName} — ${payload.projectName}`,
        metadata: {
          retainerUsd: payload.retainerMonthlyUsd,
          projectCode: payload.projectCode,
        },
        timestamp: new Date().toISOString(),
        severity: "info",
      });
    } else if (payload.action === "INVITE_TEAM_MEMBER") {
      const initials = payload.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      snapshot.teamMembers.push({
        id: `usr_${Date.now().toString(36)}`,
        orgId: payload.orgId,
        name: payload.name,
        email: payload.email,
        role: payload.role,
        title: payload.title,
        status: "invited",
        avatarInitials: initials || "TM",
        joinedAt: new Date().toISOString(),
      });

      const job = await publishToWorkQueue({
        orgId: payload.orgId,
        topic: "agencyos-email-notifications",
        eventType: "TEAMMATE_INVITATION_DISPATCHED",
        recipient: payload.email,
        subject: `You've been invited to join AgencyOS as ${payload.role.toUpperCase()}`,
        payload: {
          invitedBy: payload.actorEmail,
          role: payload.role,
        },
      });
      snapshot.pubsubJobs.unshift(job);
    } else if (payload.action === "CREATE_ORGANIZATION") {
      const orgId = `org_${Date.now().toString(36)}`;
      const newOrg: Organization = {
        id: orgId,
        name: payload.name,
        slug: payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        domain: payload.domain,
        planTier: payload.planTier,
        billingStatus: "active",
        monthlyPriceUsd:
          payload.planTier === "enterprise"
            ? 499
            : payload.planTier === "growth"
            ? 189
            : 79,
        nextBillingDate: "2026-11-23T00:00:00.000Z",
        usage: {
          storageUsedMb: 120,
          storageLimitMb: payload.planTier === "enterprise" ? 50000 : 10000,
          activeDeliverables: 1,
          deliverablesLimit: payload.planTier === "enterprise" ? 250 : 50,
          teamSeatsUsed: 1,
          teamSeatsLimit: payload.planTier === "enterprise" ? 50 : 12,
          aiCreditsUsed: 5,
          aiCreditsLimit: 500,
        },
        reminderConfig: {
          enabled: true,
          autoRemindAfterHours: 24,
          escalateOverdueHours: 48,
          sendClientReceiptCopy: true,
          channels: ["email", "pubsub_webhook"],
        },
        ssoConfig: {
          enabled: true,
          provider: "google_workspace_oidc",
          enforcedDomain: payload.domain,
          requireMfa: true,
          sessionTimeoutMinutes: 480,
        },
      };
      snapshot.organizations.push(newOrg);
      snapshot.activeOrgId = orgId;
    } else if (payload.action === "SEND_APPROVAL_REMINDER") {
      const del = snapshot.deliverables.find(
        (d) => d.id === payload.deliverableId
      );
      if (del) {
        const client = snapshot.clients.find((c) => c.id === del.clientId);
        const job = await publishToWorkQueue({
          orgId: del.orgId,
          topic: "agencyos-email-notifications",
          eventType: "MANUAL_APPROVAL_REMINDER_SENT",
          recipient: client?.contactEmail || "client@brand.co",
          subject: `[Reminder] Awaiting your sign-off on ${del.title} (v${del.currentVersion}.0)`,
          payload: {
            deliverableId: del.id,
            shareToken: del.shareToken,
            triggeredBy: payload.actorEmail,
          },
        });
        snapshot.pubsubJobs.unshift(job);
        snapshot.auditEvents.unshift({
          id: `aud_${Date.now().toString(36)}`,
          orgId: del.orgId,
          actorName: payload.actorName,
          actorEmail: payload.actorEmail,
          actorRole: "manager",
          action: "APPROVAL_REMINDER_QUEUED_TO_PUBSUB",
          targetType: "pubsub_queue",
          targetId: job.id,
          targetTitle: del.title,
          metadata: {
            recipient: client?.contactEmail || "client",
            messageId: job.messageId,
          },
          timestamp: new Date().toISOString(),
          severity: "info",
        });
      }
    } else if (payload.action === "TOGGLE_AI_TASK") {
      const del = snapshot.deliverables.find(
        (d) => d.id === payload.deliverableId
      );
      const comment = del?.comments.find((c) => c.id === payload.commentId);
      const task = comment?.aiActionItems.find((t) => t.id === payload.taskId);
      if (task) {
        task.completed = !task.completed;
      }
    } else if (payload.action === "UPDATE_WORKFLOW_STAGES") {
      snapshot.workflowStages = payload.stages as WorkflowStage[];
    } else if (payload.action === "UPDATE_BILLING_PLAN") {
      const org = snapshot.organizations.find((o) => o.id === payload.orgId);
      if (org) {
        org.planTier = payload.planTier;
        org.billingStatus = "active";
        org.monthlyPriceUsd =
          payload.planTier === "enterprise"
            ? 499
            : payload.planTier === "growth"
            ? 189
            : 79;
        org.usage.storageLimitMb =
          payload.planTier === "enterprise"
            ? 50000
            : payload.planTier === "growth"
            ? 10000
            : 2500;
        org.usage.deliverablesLimit =
          payload.planTier === "enterprise"
            ? 250
            : payload.planTier === "growth"
            ? 50
            : 15;
      }
    }

    const { provider, fallbackUsed } = await persistAgencySnapshot(snapshot);

    return NextResponse.json(
      createApiResponse({
        data: snapshot,
        provider,
        fallbackUsed,
        latencyMs: Date.now() - start,
      })
    );
  } catch (err) {
    return NextResponse.json(
      createApiError({
        code: "MUTATION_FAILED",
        message:
          err instanceof Error ? err.message : "Failed to process mutation",
      }),
      { status: 500 }
    );
  }
}
