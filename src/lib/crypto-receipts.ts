import crypto from "crypto";
import { ApprovalReceipt, AssetVersion, Deliverable, Role } from "@/types/agency";

/**
 * Computes a deterministic SHA-256 hash for an asset version based on its
 * file metadata and content identifier.
 */
export function computeAssetSha256(
  fileName: string,
  versionNumber: number,
  fileSizeMb: number,
  seedSalt: string = "agencyos-v1"
): string {
  const payload = `${fileName}::v${versionNumber}::${fileSizeMb}::${seedSalt}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Generates an immutable cryptographic signature hash binding a reviewer's
 * decision to a specific deliverable version and its SHA-256 file checksum.
 */
export function computeReceiptSignature(params: {
  deliverableId: string;
  versionId: string;
  versionNumber: number;
  fileSha256: string;
  decision: "approved" | "changes_requested" | "rejected";
  reviewerEmail: string;
  timestamp: string;
}): string {
  const canonicalString = [
    params.deliverableId,
    params.versionId,
    `v${params.versionNumber}`,
    params.fileSha256,
    params.decision.toUpperCase(),
    params.reviewerEmail.toLowerCase().trim(),
    params.timestamp,
  ].join("|");

  return crypto
    .createHmac("sha256", process.env.RECEIPT_SIGNING_SECRET || "agencyos-immutable-audit-secret-2026")
    .update(canonicalString)
    .digest("hex");
}

/**
 * Creates a verifiable ApprovalReceipt attached to a specific AssetVersion.
 */
export function createApprovalReceipt(params: {
  deliverable: Deliverable;
  version: AssetVersion;
  decision: "approved" | "changes_requested" | "rejected";
  reviewerName: string;
  reviewerEmail: string;
  reviewerRole: Role;
  comment: string;
  ipAddress?: string;
  userAgent?: string;
}): ApprovalReceipt {
  const timestamp = new Date().toISOString();
  const shortHash = crypto
    .createHash("sha256")
    .update(`${params.deliverable.id}-${params.version.id}-${timestamp}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();

  const receiptId = `RCPT-${new Date().getFullYear()}-${shortHash}`;
  const signatureHash = computeReceiptSignature({
    deliverableId: params.deliverable.id,
    versionId: params.version.id,
    versionNumber: params.version.versionNumber,
    fileSha256: params.version.fileSha256,
    decision: params.decision,
    reviewerEmail: params.reviewerEmail,
    timestamp,
  });

  return {
    id: receiptId,
    deliverableId: params.deliverable.id,
    deliverableTitle: params.deliverable.title,
    versionId: params.version.id,
    versionNumber: params.version.versionNumber,
    fileSha256: params.version.fileSha256,
    decision: params.decision,
    reviewerName: params.reviewerName,
    reviewerEmail: params.reviewerEmail,
    reviewerRole: params.reviewerRole,
    comment: params.comment,
    signatureHash,
    ipAddress: params.ipAddress || "198.51.100.42",
    userAgent: params.userAgent || "AgencyOS-Portal/2.4 (Verified Client Session)",
    timestamp,
    supersededByVersion: null,
  };
}

/**
 * Verifies that an ApprovalReceipt signature matches its canonical fields and
 * checks whether the receipt is still valid for the deliverable's current version.
 */
export function verifyApprovalReceipt(
  receipt: ApprovalReceipt,
  currentDeliverableVersion: number
): {
  authenticSignature: boolean;
  isCurrentVersion: boolean;
  requiresNewApproval: boolean;
  verificationSummary: string;
} {
  const expectedSig = computeReceiptSignature({
    deliverableId: receipt.deliverableId,
    versionId: receipt.versionId,
    versionNumber: receipt.versionNumber,
    fileSha256: receipt.fileSha256,
    decision: receipt.decision,
    reviewerEmail: receipt.reviewerEmail,
    timestamp: receipt.timestamp,
  });

  const authenticSignature = expectedSig === receipt.signatureHash;
  const isCurrentVersion = receipt.versionNumber === currentDeliverableVersion;
  const requiresNewApproval =
    receipt.decision === "approved" && !isCurrentVersion;

  let verificationSummary = "Cryptographic receipt signature verified against asset SHA-256.";
  if (!authenticSignature) {
    verificationSummary = "WARNING: Signature mismatch detected.";
  } else if (requiresNewApproval) {
    verificationSummary = `Approved on v${receipt.versionNumber}, but asset was modified in v${currentDeliverableVersion}. New client approval required.`;
  }

  return {
    authenticSignature,
    isCurrentVersion,
    requiresNewApproval,
    verificationSummary,
  };
}
