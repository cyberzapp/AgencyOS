"use client";

import React, { useState } from "react";
import {
  Share2,
  Send,
  Receipt,
  CheckCircle2,
  Lock,
  Calendar,
  Hash,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import InstagramIcon from "@mui/icons-material/Instagram";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import { useAgencyStore } from "@/store/useAgencyStore";

export function SocialAndInvoicingView() {
  const {
    deliverables,
    invoices,
    clients,
    activeOrgId,
    scheduleSocialPublish,
    pushToast,
  } = useAgencyStore();

  const orgDeliverables = deliverables.filter((d) => d.orgId === activeOrgId);
  const orgInvoices = invoices.filter((i) => i.orgId === activeOrgId);
  const orgClients = clients.filter((c) => c.orgId === activeOrgId);

  const [selectedDelId, setSelectedDelId] = useState(
    orgDeliverables[0]?.id || ""
  );
  const [platform, setPlatform] = useState<"instagram" | "linkedin" | "tiktok">(
    "instagram"
  );
  const [handle, setHandle] = useState("@luminabotanicals");
  const [caption, setCaption] = useState(
    "Sculpted by clinical botany. Introducing our Q4 Cellular Renewal Serum in frosted architectural glass."
  );
  const [hashtagsText, setHashtagsText] = useState(
    "#LuminaBotanicals #SwissEditorial #CleanLuxury #DesignSystem"
  );
  const [scheduledFor, setScheduledFor] = useState("2026-10-28T16:00");

  const activeDel =
    orgDeliverables.find((d) => d.id === selectedDelId) || orgDeliverables[0];

  const totalRetainerMonthly = orgClients.reduce(
    (sum, c) => sum + c.retainerMonthlyUsd,
    0
  );
  const totalMilestoneVolume = orgInvoices.reduce(
    (sum, i) => sum + i.amountUsd,
    0
  );

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDel) return;
    await scheduleSocialPublish({
      deliverableId: activeDel.id,
      platform,
      handle: handle.trim() || "@brand",
      caption: caption.trim(),
      hashtags: hashtagsText
        .split(/\s+/)
        .filter((h) => h.startsWith("#")),
      scheduledFor: new Date(scheduledFor).toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
              Delivery &amp; Monetization
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Direct Social Publishing &amp; Approval-Linked Milestone Invoicing
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Publish approved assets directly to Instagram, LinkedIn, or TikTok
            via GCP Pub/Sub and automatically release client milestone invoices
            upon cryptographic sign-off.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: Direct Instagram & Social Publishing Studio */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <InstagramIcon sx={{ fontSize: 18 }} className="text-slate-900" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Direct Instagram &amp; Social Network Dispatcher
                </h2>
                <p className="text-xs text-slate-500">
                  Bound to verified deliverable versions &amp; SHA-256 receipts
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Graph API v21.0
            </span>
          </div>

          <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Select Deliverable to Publish
              </label>
              <select
                value={activeDel?.id || ""}
                onChange={(e) => setSelectedDelId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-900"
              >
                {orgDeliverables.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.clientName} — {d.title} (v{d.currentVersion}.0 •{" "}
                    {d.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {activeDel && activeDel.status !== "approved" && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Approval Guardrail Notice:</strong> Version v
                  {activeDel.currentVersion}.0 is currently in{" "}
                  <span className="font-mono font-semibold">
                    {activeDel.status}
                  </span>
                  . Queuing now will hold the post in GCP Pub/Sub until the
                  client signs the v{activeDel.currentVersion}.0 receipt.
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Social Network
                </label>
                <select
                  value={platform}
                  onChange={(e) =>
                    setPlatform(
                      e.target.value as "instagram" | "linkedin" | "tiktok"
                    )
                  }
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2"
                >
                  <option value="instagram">Instagram Graph API (Feed/Reels)</option>
                  <option value="linkedin">LinkedIn Company Page API</option>
                  <option value="tiktok">TikTok Direct Post API</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Connected Account Handle
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Post Caption
              </label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  <span>Hashtags</span>
                </label>
                <input
                  type="text"
                  value={hashtagsText}
                  onChange={(e) => setHashtagsText(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Publish Timestamp</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Queue: agencyos-social-publishing
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Queue Direct Social Publish</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 6 Cols: Agency Accounting & Approval-Linked Milestone Invoicing */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <AccountBalanceOutlinedIcon
                sx={{ fontSize: 18 }}
                className="text-slate-900"
              />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Agency Accounting &amp; Approval-Linked Invoicing
                </h2>
                <p className="text-xs text-slate-500">
                  Milestone invoices automatically unlock when clients sign
                  approval receipts
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">
                ACTIVE MONTHLY RETAINERS
              </span>
              <span className="text-xl font-mono font-bold text-slate-900 mt-1 block">
                ${totalRetainerMonthly.toLocaleString()}/mo
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-500 block">
                DELIVERABLE MILESTONE LEDGER
              </span>
              <span className="text-xl font-mono font-bold text-emerald-700 mt-1 block">
                ${totalMilestoneVolume.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {orgInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 bg-white hover:bg-slate-50/70 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-700">
                      {inv.clientName}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    ${inv.amountUsd.toLocaleString()}
                  </span>
                </div>

                <p className="text-slate-600">{inv.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${
                      inv.status === "paid"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : inv.status === "sent"
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {inv.status.replace(/_/g, " ")}
                  </span>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    {inv.linkedReceiptId ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Receipt: {inv.linkedReceiptId}
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked until Client Approval
                      </span>
                    )}
                    <button
                      onClick={() =>
                        pushToast(
                          `Invoice ${inv.invoiceNumber} Dispatched`,
                          `Sent PDF invoice ($${inv.amountUsd.toLocaleString()}) with attached Approval Receipt proof.`,
                          "success"
                        )
                      }
                      className="underline text-slate-900 font-sans font-medium ml-1"
                    >
                      Send PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
