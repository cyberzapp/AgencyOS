"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  FileWarning,
  CheckCircle2,
  Upload,
  Lock,
  History,
  Terminal,
  Copy,
} from "lucide-react";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";
import { useAgencyStore } from "@/store/useAgencyStore";

export function VersionReceiptsView() {
  const {
    deliverables,
    auditEvents,
    activeOrgId,
    uploadNewVersion,
    submitApprovalDecision,
    pushToast,
  } = useAgencyStore();

  const orgDeliverables = deliverables.filter((d) => d.orgId === activeOrgId);
  const orgAuditEvents = auditEvents.filter((a) => a.orgId === activeOrgId);

  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(
    null
  );

  // Flatten all receipts across deliverables in this tenant
  const allReceipts = orgDeliverables.flatMap((del) =>
    del.receipts.map((r) => ({
      receipt: r,
      deliverable: del,
      isCurrentVersion: r.versionNumber === del.currentVersion,
      requiresNewApproval:
        r.decision === "approved" && r.versionNumber !== del.currentVersion,
    }))
  );

  const activeReceiptEntry =
    allReceipts.find((entry) => entry.receipt.id === selectedReceiptId) ||
    allReceipts[0];

  const handleSimulateDesignerModification = async (delId: string) => {
    const del = orgDeliverables.find((d) => d.id === delId);
    if (!del) return;
    await uploadNewVersion({
      deliverableId: del.id,
      label: `v${del.currentVersion + 1}.0 — Post-Approval Designer File Edit`,
      fileName: `${del.id}-modified-v${del.currentVersion + 1}.jpg`,
      fileUrl:
        del.versions[del.versions.length - 1]?.fileUrl ||
        "/assets/deliverables/lumina-skincare-v2.jpg",
      fileSizeMb: 9.4,
      changeSummary:
        "Designer modified approved source file. Cryptographic SHA-256 hash changed; previous approval receipt superseded and new client sign-off required.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
              Feature C
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Version History &amp; Cryptographic Approval Receipts
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Each approval is cryptographically bound to a specific asset version
            (SHA-256). If a designer modifies an approved file, AgencyOS
            invalidates the approval status and requires a fresh client receipt.
          </p>
        </div>
      </div>

      {/* Interactive Rule C Guardrail Simulator Banner */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-800" />
              <span>
                Version Integrity &amp; Re-Approval Guardrail Matrix
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Test how AgencyOS protects agencies and clients: click{" "}
              <strong>&ldquo;Simulate Designer Edit&rdquo;</strong> on any
              approved deliverable to see its receipt superseded and re-approval
              triggered automatically.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orgDeliverables.map((del) => {
            const latestVer = del.versions[del.versions.length - 1];
            const approvedReceipts = del.receipts.filter(
              (r) => r.decision === "approved"
            );

            return (
              <div
                key={del.id}
                className={`p-4 rounded-xl border transition-all ${
                  del.requiresReapproval
                    ? "bg-amber-50/50 border-amber-300"
                    : del.status === "approved"
                    ? "bg-emerald-50/30 border-emerald-200"
                    : "bg-slate-50/60 border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500">
                      {del.clientName}
                    </span>
                    <h3 className="text-xs font-semibold text-slate-900 mt-0.5">
                      {del.title}
                    </h3>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200">
                    v{del.currentVersion}.0
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-[11px] font-mono text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Current SHA-256:</span>
                    <span className="text-slate-900">
                      {latestVer?.fileSha256.slice(0, 18)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Version Chain:</span>
                    <span>
                      {del.versions.map((v) => `v${v.versionNumber}`).join(" → ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Receipt State:</span>
                    {del.requiresReapproval ? (
                      <span className="text-amber-800 font-semibold flex items-center gap-1">
                        <GppMaybeOutlinedIcon sx={{ fontSize: 13 }} />
                        v{del.previousApprovedVersion} Superseded — Needs Re-Approval
                      </span>
                    ) : del.status === "approved" ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <VerifiedOutlinedIcon sx={{ fontSize: 13 }} />
                        Locked on v{del.currentVersion}.0 (
                        {approvedReceipts[0]?.id || "Verified"})
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        Awaiting Client Sign-Off
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2">
                  {del.status === "approved" ? (
                    <button
                      onClick={() => handleSimulateDesignerModification(del.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        Simulate Designer File Edit (v{del.currentVersion + 1}.0)
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        submitApprovalDecision({
                          deliverableId: del.id,
                          decision: "approved",
                          comment: `Signed off on v${del.currentVersion}.0 after verifying version diff.`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        Issue Client Approval Receipt for v{del.currentVersion}.0
                      </span>
                    </button>
                  )}

                  <span className="text-[11px] font-mono text-slate-400">
                    {del.receipts.length} receipt(s)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Split View: Left Cryptographic Receipts Table + Right Certificate Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: All Approval Receipts */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-600" />
              <span>Immutable Approval Receipts ({allReceipts.length})</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Who Approved What &amp; When
            </span>
          </div>

          <div className="divide-y divide-slate-200/80">
            {allReceipts.map((entry) => {
              const { receipt, deliverable, requiresNewApproval } = entry;
              const isSelected = activeReceiptEntry?.receipt.id === receipt.id;

              return (
                <div
                  key={receipt.id}
                  onClick={() => setSelectedReceiptId(receipt.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-900/[0.03] border-l-4 border-l-slate-900"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {receipt.id}
                        </span>
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                            receipt.decision === "approved"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {receipt.decision.replace("_", " ")} • v
                          {receipt.versionNumber}.0
                        </span>
                        {requiresNewApproval && (
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 font-semibold">
                            Superseded by v{deliverable.currentVersion}.0
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 mt-1">
                        {receipt.deliverableTitle}
                      </h4>
                    </div>

                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(receipt.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1.5">
                    &ldquo;{receipt.comment}&rdquo;
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
                    <span>
                      Reviewer: {receipt.reviewerName} ({receipt.reviewerEmail})
                    </span>
                    <span>SHA-256: {receipt.fileSha256.slice(0, 14)}...</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Cryptographic Receipt Certificate Details */}
        {activeReceiptEntry && (
          <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Cryptographic Certificate
                </span>
                <h3 className="text-base font-mono font-bold text-slate-900">
                  {activeReceiptEntry.receipt.id}
                </h3>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    JSON.stringify(activeReceiptEntry.receipt, null, 2)
                  );
                  pushToast(
                    "Receipt JSON Copied",
                    `Cryptographic receipt ${activeReceiptEntry.receipt.id} copied.`,
                    "success"
                  );
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </button>
            </div>

            {activeReceiptEntry.requiresNewApproval ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 flex items-start gap-2.5 text-xs text-amber-950">
                <FileWarning className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Superseded by Newer File Version:</strong> This receipt
                  validates <strong>v{activeReceiptEntry.receipt.versionNumber}.0</strong>,
                  but the deliverable is now on{" "}
                  <strong>v{activeReceiptEntry.deliverable.currentVersion}.0</strong>.
                  A new approval receipt is required for the current version.
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-950">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Authentic &amp; Current:</strong> HMAC-SHA256 signature
                  matches canonical version{" "}
                  <strong>v{activeReceiptEntry.receipt.versionNumber}.0</strong>.
                </div>
              </div>
            )}

            <div className="space-y-2.5 text-xs font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] text-slate-400 block">
                  DELIVERABLE &amp; VERSION
                </span>
                <span className="text-slate-900 font-semibold">
                  {activeReceiptEntry.receipt.deliverableTitle} (v
                  {activeReceiptEntry.receipt.versionNumber}.0)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">
                  REVIEWER IDENTITY
                </span>
                <span className="text-slate-800">
                  {activeReceiptEntry.receipt.reviewerName} &lt;
                  {activeReceiptEntry.receipt.reviewerEmail}&gt;
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">
                  TIMESTAMP &amp; CLIENT IP
                </span>
                <span className="text-slate-800">
                  {activeReceiptEntry.receipt.timestamp} •{" "}
                  {activeReceiptEntry.receipt.ipAddress}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">
                  ASSET FILE SHA-256 CHECKSUM
                </span>
                <span className="text-slate-700 break-all text-[11px]">
                  {activeReceiptEntry.receipt.fileSha256}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">
                  HMAC-SHA256 RECEIPT SIGNATURE
                </span>
                <span className="text-slate-700 break-all text-[11px]">
                  {activeReceiptEntry.receipt.signatureHash}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Immutable Audit Trail Stream */}
      <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-slate-700" />
            <span>Immutable Organization Audit Log ({orgAuditEvents.length})</span>
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            GCP Cloud Logging &amp; Firestore Synced
          </span>
        </div>

        <div className="divide-y divide-slate-200/70 max-h-80 overflow-y-auto">
          {orgAuditEvents.map((ev) => (
            <div
              key={ev.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-50/70"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                    ev.severity === "success"
                      ? "bg-emerald-600"
                      : ev.severity === "warning"
                      ? "bg-amber-500"
                      : "bg-slate-500"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-slate-900">
                      {ev.action}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-medium text-slate-700">
                      {ev.targetTitle}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Actor: {ev.actorName} ({ev.actorRole}) •{" "}
                    {JSON.stringify(ev.metadata)}
                  </div>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-400 shrink-0">
                {new Date(ev.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
