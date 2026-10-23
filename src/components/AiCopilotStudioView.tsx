"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Bot,
  Wand2,
  ArrowRight,
  Send,
  Layers,
} from "lucide-react";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { useAgencyStore } from "@/store/useAgencyStore";
import { AIActionItem } from "@/types/agency";

const SAMPLE_CLIENT_PROMPTS = [
  "Can we make the warm terracotta podium look more like cool white marble, soften the shadow on the right, and make sure the FDA botanical disclaimer is 10pt minimum?",
  "The headline kerning feels too tight on mobile, the CTA button needs stronger contrast against the slate background, and please swap the tagline to our Q4 approved copy.",
  "Move the barcode 4mm left away from the fold line, boost the roast altitude font weight, and brighten the cold brew aluminum highlight.",
];

export function AiCopilotStudioView() {
  const {
    deliverables,
    activeOrgId,
    sendApprovalReminder,
    submitApprovalDecision,
    pushToast,
  } = useAgencyStore();

  const orgDeliverables = deliverables.filter((d) => d.orgId === activeOrgId);

  const [selectedDelId, setSelectedDelId] = useState(
    orgDeliverables[0]?.id || ""
  );
  const [rawClientFeedback, setRawClientFeedback] = useState(
    SAMPLE_CLIENT_PROMPTS[0]
  );
  const [synthesizedItems, setSynthesizedItems] = useState<AIActionItem[]>([
    {
      id: "init_1",
      task: "Replace warm terracotta podium with cool white marble shader",
      category: "color",
      priority: "high",
      completed: false,
    },
    {
      id: "init_2",
      task: "Soften directional right-side shadow with studio fill lighting",
      category: "layout",
      priority: "medium",
      completed: false,
    },
    {
      id: "init_3",
      task: "Verify FDA botanical disclaimer meets 10pt minimum legibility spec",
      category: "compliance",
      priority: "high",
      completed: false,
    },
  ]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [providerUsed, setProviderUsed] = useState("vertex_gemini_resilient");

  const activeDel =
    orgDeliverables.find((d) => d.id === selectedDelId) || orgDeliverables[0];

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawClientFeedback.trim()) return;
    setIsSynthesizing(true);
    try {
      const res = await fetch("/api/ai/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliverableTitle: activeDel?.title || "Brand Campaign Asset",
          comment: rawClientFeedback,
          versionNumber: activeDel?.currentVersion || 1,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.items) {
        setSynthesizedItems(json.data.items);
        setProviderUsed(json.meta?.provider || "resilient_local_engine");
        pushToast(
          `Extracted ${json.data.items.length} Actionable Tasks`,
          "Client feedback parsed into categorized designer checklist items.",
          "success"
        );
      }
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleAttachToDeliverable = async () => {
    if (!activeDel) return;
    await submitApprovalDecision({
      deliverableId: activeDel.id,
      decision: "changes_requested",
      comment: rawClientFeedback,
      pinX: 50,
      pinY: 50,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
              Google Gemini AI Copilot
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              AI Feedback-to-Action Synthesizer &amp; Autonomous Agency Agent
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Instead of generic AI slop, AgencyOS uses Google Gemini to turn
            messy, vague client feedback into traceable, categorized designer
            checklists and autonomous bottleneck recovery actions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Interactive Feedback-to-Action Synthesizer */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <AutoAwesomeOutlinedIcon
                sx={{ fontSize: 18 }}
                className="text-amber-600"
              />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Gemini Feedback Actionability Lab
                </h2>
                <p className="text-xs text-slate-500">
                  Convert unstructured client emails or Slack threads into
                  pinned revision checklists
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Engine: {providerUsed}
            </span>
          </div>

          <form onSubmit={handleSynthesize} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Deliverable
              </label>
              <select
                value={activeDel?.id || ""}
                onChange={(e) => setSelectedDelId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium"
              >
                {orgDeliverables.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.clientName} — {d.title} (v{d.currentVersion}.0)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Raw Unstructured Client Comment
                </label>
                <div className="flex items-center gap-1">
                  {SAMPLE_CLIENT_PROMPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRawClientFeedback(sample)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      Preset #{idx + 1}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={3}
                value={rawClientFeedback}
                onChange={(e) => setRawClientFeedback(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 text-slate-900"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={isSynthesizing}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>
                  {isSynthesizing
                    ? "Synthesizing with Gemini..."
                    : "Extract Actionable Designer Tasks"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleAttachToDeliverable}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs font-medium hover:bg-amber-100"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Attach Tasks to v{activeDel?.currentVersion || 1}.0</span>
              </button>
            </div>
          </form>

          {/* Extracted Checklist Results */}
          <div className="pt-2 space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-500">
              Structured Designer Action Items ({synthesizedItems.length})
            </div>

            {synthesizedItems.map((item, i) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                    0{i + 1}
                  </span>
                  <span className="text-slate-900 font-medium">{item.task}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] uppercase">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {item.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      item.priority === "high"
                        ? "bg-rose-50 text-rose-800 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Autonomous Agency Triage Agent */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-slate-900" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Autonomous Agency Delivery Agent
                </h2>
                <p className="text-xs text-slate-500">
                  Continuous SLA monitoring &amp; one-click autonomous actions
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Online
            </span>
          </div>

          <div className="space-y-3">
            {orgDeliverables.map((del) => {
              const needsAction =
                del.requiresReapproval || del.status !== "approved";
              return (
                <div
                  key={del.id}
                  className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {del.clientName} — v{del.currentVersion}.0
                    </span>
                    <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200">
                      {del.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    {del.requiresReapproval
                      ? `Agent detected post-approval file edit on v${del.currentVersion}.0. Recommend immediate client re-approval dispatch.`
                      : del.status === "approved"
                      ? `Receipt locked (${del.receipts[0]?.id}). Ready for direct Instagram/LinkedIn publishing.`
                      : `Turnaround at ${del.turnaroundHours}h. Recommend automated Pub/Sub follow-up to stakeholder.`}
                  </p>

                  {needsAction && (
                    <button
                      onClick={() => sendApprovalReminder(del.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-900 hover:underline pt-0.5"
                    >
                      <span>Execute Autonomous Pub/Sub Follow-Up</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
