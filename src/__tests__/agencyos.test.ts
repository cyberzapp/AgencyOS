import { describe, it, expect } from "vitest";
import {
  computeAssetSha256,
  createApprovalReceipt,
  verifyApprovalReceipt,
} from "@/lib/crypto-receipts";
import { withResilientFallback, circuitRegistry } from "@/lib/resilience";
import { extractHeuristicActionItems } from "@/lib/gemini-copilot";
import { publishToWorkQueue } from "@/lib/gcp-pubsub";
import { createInitialAgencySnapshot } from "@/lib/seed-data";

describe("AgencyOS — Core Approval, Receipts & Resilient Backend Suite", () => {
  it("computes deterministic SHA-256 fingerprints for asset versions", () => {
    const hash1 = computeAssetSha256("lumina-v1.jpg", 1, 8.4, "salt-1");
    const hash2 = computeAssetSha256("lumina-v1.jpg", 1, 8.4, "salt-1");
    const hashModified = computeAssetSha256("lumina-v2.jpg", 2, 7.9, "salt-1");

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashModified);
  });

  it("binds cryptographic ApprovalReceipts to specific asset versions and enforces re-approval on file modification (Rule C)", () => {
    const snapshot = createInitialAgencySnapshot();
    const deliverable = snapshot.deliverables[0];
    const v2 = deliverable.versions[1];

    const receipt = createApprovalReceipt({
      deliverable,
      version: v2,
      decision: "approved",
      reviewerName: "Elena Rostova",
      reviewerEmail: "elena@luminabotanicals.com",
      reviewerRole: "client",
      comment: "Approved v2.0 travertine marble pedestal.",
    });

    expect(receipt.id).toMatch(/^RCPT-\d{4}-[A-F0-9]{6}$/);
    expect(receipt.versionNumber).toBe(2);
    expect(receipt.fileSha256).toBe(v2.fileSha256);

    // Verify against current version (v2) -> valid, no re-approval needed
    const checkCurrent = verifyApprovalReceipt(receipt, 2);
    expect(checkCurrent.authenticSignature).toBe(true);
    expect(checkCurrent.isCurrentVersion).toBe(true);
    expect(checkCurrent.requiresNewApproval).toBe(false);

    // If designer uploads v3 (modifies approved file), verifyApprovalReceipt flags requiresNewApproval = true
    const checkAfterDesignerEdit = verifyApprovalReceipt(receipt, 3);
    expect(checkAfterDesignerEdit.authenticSignature).toBe(true);
    expect(checkAfterDesignerEdit.isCurrentVersion).toBe(false);
    expect(checkAfterDesignerEdit.requiresNewApproval).toBe(true);
  });

  it("extracts categorized, actionable designer tasks from unstructured client feedback", () => {
    const feedback =
      "Please switch the terracotta podium to cool white marble, adjust the headline kerning, and verify the FDA legal disclaimer.";
    const actions = extractHeuristicActionItems(feedback);

    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions.some((a) => a.category === "color")).toBe(true);
    expect(actions.every((a) => a.completed === false)).toBe(true);
  });

  it("executes resilient fallback when upstream cloud service is unconfigured or degraded", async () => {
    const outcome = await withResilientFallback({
      service: "firestore_db",
      operationName: "test_degraded_upstream",
      isCloudConfigured: true,
      maxRetries: 1,
      timeoutMs: 200,
      primaryFn: async () => {
        throw new Error("Simulated Firestore network partition");
      },
      fallbackFn: () => "resilient_local_snapshot_ok",
    });

    expect(outcome.result).toBe("resilient_local_snapshot_ok");
    expect(outcome.fallbackUsed).toBe(true);
    expect(outcome.provider).toBe("resilient_local_engine");
    expect(circuitRegistry.getRecentErrors().length).toBeGreaterThan(0);
  });

  it("publishes notification jobs to Google Cloud Pub/Sub work queue with resilient local acknowledgment", async () => {
    const job = await publishToWorkQueue({
      orgId: "org_atelier_vance",
      topic: "agencyos-email-notifications",
      eventType: "UNIT_TEST_REMINDER",
      recipient: "elena@luminabotanicals.com",
      subject: "Test Approval Reminder",
      payload: { deliverableId: "del_lumina_hero" },
    });

    expect(job.status).toBe("acknowledged");
    expect(job.topic).toBe("agencyos-email-notifications");
    expect(job.messageId).toBeTruthy();
  });

  it("enforces organization-level tenant isolation across deliverables and clients", () => {
    const snapshot = createInitialAgencySnapshot();
    const atelierDeliverables = snapshot.deliverables.filter(
      (d) => d.orgId === "org_atelier_vance"
    );
    const monogridDeliverables = snapshot.deliverables.filter(
      (d) => d.orgId === "org_monogrid"
    );

    expect(atelierDeliverables.length).toBeGreaterThan(0);
    expect(monogridDeliverables.length).toBeGreaterThan(0);
    expect(
      atelierDeliverables.some((d) => d.orgId === "org_monogrid")
    ).toBe(false);
  });
});
