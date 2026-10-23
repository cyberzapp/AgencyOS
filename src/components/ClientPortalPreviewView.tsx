"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  MessageSquarePlus,
  ShieldCheck,
  ExternalLink,
  Copy,
  Smartphone,
  Monitor,
  MapPin,
  Lock,
  Sparkles,
  FileCheck,
} from "lucide-react";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useAgencyStore } from "@/store/useAgencyStore";

export function ClientPortalPreviewView({
  standaloneToken,
}: {
  standaloneToken?: string;
}) {
  const {
    deliverables,
    clients,
    organizations,
    activeOrgId,
    selectedDeliverableId,
    setSelectedDeliverableId,
    submitApprovalDecision,
    pushToast,
  } = useAgencyStore();

  const orgDeliverables = deliverables.filter((d) => d.orgId === activeOrgId);
  const activeDeliverable = standaloneToken
    ? deliverables.find(
        (d) => d.shareToken === standaloneToken || d.id === standaloneToken
      ) || orgDeliverables[0]
    : orgDeliverables.find((d) => d.id === selectedDeliverableId) ||
      orgDeliverables[0];

  const clientObj = clients.find((c) => c.id === activeDeliverable?.clientId);
  const agencyObj = organizations.find((o) => o.id === activeDeliverable?.orgId);

  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [selectedVerNum, setSelectedVerNum] = useState<number | null>(null);
  const [reviewerName, setReviewerName] = useState(
    clientObj?.contactName || "Elena Rostova"
  );
  const [reviewerEmail, setReviewerEmail] = useState(
    clientObj?.contactEmail || "elena@luminabotanicals.com"
  );
  const [commentText, setCommentText] = useState("");
  const [pin, setPin] = useState<{ x: number; y: number }>({ x: 48, y: 54 });
  const [latestIssuedReceiptId, setLatestIssuedReceiptId] = useState<
    string | null
  >(null);

  if (!activeDeliverable) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-xl text-center text-xs text-slate-500">
        No deliverable found for this portal link.
      </div>
    );
  }

  const currentVersionObj =
    activeDeliverable.versions.find(
      (v) => v.versionNumber === (selectedVerNum ?? activeDeliverable.currentVersion)
    ) ||
    activeDeliverable.versions[activeDeliverable.versions.length - 1];

  const latestReceipt = activeDeliverable.receipts[0] || null;

  const handleDeliverableSwitch = (delId: string) => {
    setSelectedDeliverableId(delId);
    setSelectedVerNum(null);
    setLatestIssuedReceiptId(null);
    const nextDel = deliverables.find((d) => d.id === delId);
    const nextCli = clients.find((c) => c.id === nextDel?.clientId);
    if (nextCli) {
      setReviewerName(nextCli.contactName);
      setReviewerEmail(nextCli.contactEmail);
    }
  };

  const handleDecision = async (
    decision: "approved" | "changes_requested" | "rejected"
  ) => {
    await submitApprovalDecision({
      deliverableId: activeDeliverable.id,
      decision,
      reviewerName: reviewerName.trim() || "Client Stakeholder",
      reviewerEmail: reviewerEmail.trim() || "client@brand.com",
      reviewerRole: "client",
      comment:
        commentText.trim() ||
        (decision === "approved"
          ? `Approved v${activeDeliverable.currentVersion}.0 for final delivery.`
          : "Requesting adjustments on the highlighted pin region."),
      pinX: pin.x,
      pinY: pin.y,
    });
    setCommentText("");
    setLatestIssuedReceiptId("ISSUED");
  };

  return (
    <div className="space-y-5">
      {/* Top Control Strip (only shown inside agency workspace, hidden on standalone client link if desired) */}
      {!standaloneToken && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
                Feature B
              </span>
              <h1 className="text-lg font-semibold text-slate-900">
                Frictionless Client Approval Portal
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Clients open a secure magic link, inspect the asset, drop visual
              pins, and sign an immutable approval receipt — zero login or PM
              training required.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Select Deliverable Portal Link"
              value={activeDeliverable.id}
              onChange={(e) => handleDeliverableSwitch(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-800"
            >
              {orgDeliverables.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.clientName}: {d.title.slice(0, 34)}... (v{d.currentVersion}
                  .0)
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setViewportMode("desktop")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                  viewportMode === "desktop"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => setViewportMode("mobile")}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                  viewportMode === "mobile"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Companion</span>
              </button>
            </div>

            <button
              onClick={() => {
                const url = `${window.location.origin}/portal/${activeDeliverable.shareToken}`;
                navigator.clipboard?.writeText(url);
                pushToast(
                  "Secure Review Link Copied",
                  `/portal/${activeDeliverable.shareToken} copied to clipboard.`,
                  "success"
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </button>

            <Link
              href={`/portal/${activeDeliverable.shareToken}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Standalone URL</span>
            </Link>
          </div>
        </div>
      )}

      {/* Client Portal Frame */}
      <div
        className={`mx-auto transition-all ${
          viewportMode === "mobile" ? "max-w-[420px]" : "max-w-6xl"
        }`}
      >
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          {/* Secure Portal Browser Top Bar */}
          <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-emerald-400">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <div>
                <div className="text-xs font-semibold flex items-center gap-2">
                  <span>{agencyObj?.name || "Atelier Vance Creative"}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-300 font-normal">
                    Client Review Portal
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  https://portal.agencyos.cloud/portal/
                  {activeDeliverable.shareToken}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-200 border border-white/10">
                SHA-256: {currentVersionObj.fileSha256.slice(0, 12)}...
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                TLS Verified
              </span>
            </div>
          </div>

          {/* Re-Approval Required Banner if Designer Changed Approved File */}
          {activeDeliverable.requiresReapproval && (
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center justify-between gap-3 text-xs text-amber-950">
              <div>
                <strong>Updated Version Requires Your Sign-Off:</strong> You
                previously approved{" "}
                <span className="font-mono font-semibold">
                  v{activeDeliverable.previousApprovedVersion}.0
                </span>
                , and the agency uploaded modified file{" "}
                <span className="font-mono font-semibold">
                  v{activeDeliverable.currentVersion}.0
                </span>
                . Please review the changes below and issue a new approval.
              </div>
              <span className="shrink-0 font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-amber-200/80 text-amber-950 font-semibold">
                v{activeDeliverable.currentVersion}.0 Pending
              </span>
            </div>
          )}

          {/* Portal Content Grid */}
          <div
            className={`grid grid-cols-1 ${
              viewportMode === "mobile" ? "" : "lg:grid-cols-12"
            } divide-y lg:divide-y-0 lg:divide-x divide-slate-200`}
          >
            {/* Left 7 Cols: High-Res Asset Viewer with Pin Placement */}
            <div
              className={`${
                viewportMode === "mobile" ? "" : "lg:col-span-7"
              } p-5 space-y-4 bg-[#FAF9F6]/60`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono uppercase text-slate-500">
                    {activeDeliverable.clientName} •{" "}
                    {activeDeliverable.projectName}
                  </span>
                  <h2 className="text-base font-semibold text-slate-900">
                    {activeDeliverable.title}
                  </h2>
                </div>

                {/* Version Switcher Pills */}
                <div className="flex items-center gap-1">
                  {activeDeliverable.versions.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVerNum(v.versionNumber)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${
                        currentVersionObj.versionNumber === v.versionNumber
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      v{v.versionNumber}.0
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Image Stage */}
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.round(
                    ((e.clientX - rect.left) / rect.width) * 100
                  );
                  const y = Math.round(
                    ((e.clientY - rect.top) / rect.height) * 100
                  );
                  setPin({ x, y });
                }}
                className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center cursor-crosshair"
              >
                <img
                  src={currentVersionObj.fileUrl}
                  alt={currentVersionObj.label}
                  className="w-full max-h-[460px] object-contain"
                />
                <div
                  style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-mono text-[10px] font-bold border-2 border-white shadow-lg flex items-center gap-1"
                >
                  <MapPin className="w-3 h-3" />
                  <span>
                    Pin ({pin.x}%, {pin.y}%)
                  </span>
                </div>
              </div>

              {/* Designer Version Release Notes */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">
                    {currentVersionObj.label}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">
                    Uploaded by {currentVersionObj.uploadedBy} •{" "}
                    {currentVersionObj.fileSizeMb} MB
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {currentVersionObj.changeSummary}
                </p>
              </div>
            </div>

            {/* Right 5 Cols: Client Decision & Cryptographic Receipt Panel */}
            <div
              className={`${
                viewportMode === "mobile" ? "" : "lg:col-span-5"
              } p-5 space-y-5 bg-white`}
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Your Review &amp; Approval Sign-Off
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approving locks version{" "}
                  <span className="font-mono font-semibold text-slate-800">
                    v{activeDeliverable.currentVersion}.0
                  </span>{" "}
                  with a permanent cryptographic receipt.
                </p>
              </div>

              {/* Reviewer Identity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 bg-slate-50/60"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Verified Email
                  </label>
                  <input
                    type="email"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-900 bg-slate-50/60"
                  />
                </div>
              </div>

              {/* Feedback Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-700">
                    Feedback or Approval Note
                  </label>
                  <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Visual Pin: {pin.x}%, {pin.y}%
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Optional: Add specific revision notes (e.g., 'Make the stone cooler and adjust headline kerning') or sign-off comments..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                />
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>
                    AgencyOS automatically converts your revision notes into a
                    traceable checklist for the design team.
                  </span>
                </p>
              </div>

              {/* Primary Decision Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={() => handleDecision("approved")}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Approve Version v{activeDeliverable.currentVersion}.0 &amp;
                    Generate Receipt
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => handleDecision("changes_requested")}
                    className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Request Revisions</span>
                  </button>

                  <button
                    onClick={() => handleDecision("rejected")}
                    className="py-2 px-3 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-700 hover:text-rose-800 text-xs font-medium transition-colors"
                  >
                    Reject Asset
                  </button>
                </div>
              </div>

              {/* Latest Cryptographic Approval Receipt Certificate */}
              {latestReceipt && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-semibold">
                      <VerifiedIcon
                        sx={{ fontSize: 15 }}
                        className="text-emerald-600"
                      />
                      {latestIssuedReceiptId
                        ? "New Receipt Issued"
                        : "Latest Recorded Receipt"}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {latestReceipt.id}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        DECISION
                      </span>
                      <span
                        className={`font-semibold uppercase ${
                          latestReceipt.decision === "approved"
                            ? "text-emerald-700"
                            : "text-amber-700"
                        }`}
                      >
                        {latestReceipt.decision.replace("_", " ")} (v
                        {latestReceipt.versionNumber}.0)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        SIGNED BY
                      </span>
                      <span className="text-slate-800 truncate block">
                        {latestReceipt.reviewerName}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">
                        FILE SHA-256 FINGERPRINT
                      </span>
                      <span className="text-slate-700 break-all">
                        {latestReceipt.fileSha256.slice(0, 36)}...
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">
                        HMAC SIGNATURE DIGEST
                      </span>
                      <span className="text-slate-600 break-all">
                        {latestReceipt.signatureHash.slice(0, 36)}...
                      </span>
                    </div>
                  </div>

                  {latestReceipt.supersededByVersion && (
                    <div className="text-[11px] text-amber-800 bg-amber-50/90 px-2.5 py-1.5 rounded border border-amber-200 font-medium">
                      Note: This v{latestReceipt.versionNumber}.0 receipt was
                      superseded when v{latestReceipt.supersededByVersion}.0 was
                      uploaded.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
