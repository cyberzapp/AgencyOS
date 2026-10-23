"use client";

import React, { useState } from "react";
import {
  GitBranch,
  GripVertical,
  Plus,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Sparkles,
  Mail,
  Server,
  CheckCircle2,
  BellRing,
} from "lucide-react";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import { useAgencyStore } from "@/store/useAgencyStore";
import { Role, WorkflowStage } from "@/types/agency";

export function WorkflowAndQueueView() {
  const {
    workflowStages,
    updateWorkflowStages,
    pubsubJobs,
    organizations,
    activeOrgId,
    pushToast,
  } = useAgencyStore();

  const activeOrg =
    organizations.find((o) => o.id === activeOrgId) || organizations[0];

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [newStageRole, setNewStageRole] = useState<Role>("manager");
  const [newStageSla, setNewStageSla] = useState(12);
  const [topicFilter, setTopicFilter] = useState<string>("all");

  const moveStage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= workflowStages.length) return;
    const copy = [...workflowStages];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    const reordered = copy.map((s, idx) => ({ ...s, order: idx + 1 }));
    updateWorkflowStages(reordered);
  };

  const toggleStageFlag = (
    stageId: string,
    field: "autoNotifyClient" | "requireSha256Receipt" | "aiGuardrailCheck"
  ) => {
    const updated = workflowStages.map((s) =>
      s.id === stageId ? { ...s, [field]: !s[field] } : s
    );
    updateWorkflowStages(updated);
  };

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;
    const newStage: WorkflowStage = {
      id: `stg_custom_${Date.now().toString(36)}`,
      name: `${workflowStages.length + 1}. ${newStageName.trim()}`,
      description:
        "Custom approval gate with automated Pub/Sub notifications and SLA tracking.",
      roleRequired: newStageRole,
      slaHours: newStageSla,
      autoNotifyClient: true,
      requireSha256Receipt: newStageRole === "client",
      aiGuardrailCheck: true,
      order: workflowStages.length + 1,
    };
    updateWorkflowStages([...workflowStages, newStage]);
    setNewStageName("");
  };

  const filteredJobs = pubsubJobs.filter((j) =>
    topicFilter === "all" ? true : j.topic === topicFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
              Workflow &amp; GCP Pub/Sub
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Drag-and-Drop Approval Workflow Builder &amp; Work Queues
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Configure multi-stage agency approval pipelines and inspect Google
            Cloud Pub/Sub event queues for email notifications and reminders.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 6 Cols: Drag-and-Drop Workflow Stage Builder */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <GitBranch className="w-4 h-4 text-slate-800" />
                <span>Interactive Drag-and-Drop Pipeline Builder</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Drag stages or use arrow controls to reorder gates and toggle
                SHA-256 &amp; AI guardrails.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {workflowStages.length} Gates Active
            </span>
          </div>

          <div className="space-y-3">
            {workflowStages.map((stage, idx) => (
              <div
                key={stage.id}
                draggable
                onDragStart={() => setDraggedIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedIdx !== null && draggedIdx !== idx) {
                    moveStage(draggedIdx, idx);
                  }
                  setDraggedIdx(null);
                }}
                className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <GripVertical className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">
                          {stage.name}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          Role: {stage.roleRequired}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          SLA: {stage.slaHours}h
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => moveStage(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Move stage up"
                      className="p-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-100"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveStage(idx, idx + 1)}
                      disabled={idx === workflowStages.length - 1}
                      title="Move stage down"
                      className="p-1 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-30 hover:bg-slate-100"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stage Toggles */}
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  <button
                    onClick={() =>
                      toggleStageFlag(stage.id, "requireSha256Receipt")
                    }
                    className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border transition-colors ${
                      stage.requireSha256Receipt
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-white text-slate-500 border-slate-200"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>
                      SHA-256 Receipt:{" "}
                      {stage.requireSha256Receipt ? "Required" : "Optional"}
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      toggleStageFlag(stage.id, "aiGuardrailCheck")
                    }
                    className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border transition-colors ${
                      stage.aiGuardrailCheck
                        ? "bg-amber-50 text-amber-900 border-amber-200"
                        : "bg-white text-slate-500 border-slate-200"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>
                      Gemini AI Check: {stage.aiGuardrailCheck ? "ON" : "OFF"}
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      toggleStageFlag(stage.id, "autoNotifyClient")
                    }
                    className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded border transition-colors ${
                      stage.autoNotifyClient
                        ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                        : "bg-white text-slate-500 border-slate-200"
                    }`}
                  >
                    <Mail className="w-3 h-3" />
                    <span>
                      Pub/Sub Email: {stage.autoNotifyClient ? "Auto" : "Manual"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Stage Form */}
          <form
            onSubmit={handleAddStage}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
          >
            <div className="text-xs font-semibold text-slate-800">
              + Add Custom Workflow Stage
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="e.g., Legal & Compliance Sign-Off"
                className="sm:col-span-2 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2"
              />
              <select
                value={newStageRole}
                onChange={(e) => setNewStageRole(e.target.value as Role)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2"
              >
                <option value="designer">Designer</option>
                <option value="manager">Manager</option>
                <option value="client">Client</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Target SLA (Hours):</span>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={newStageSla}
                  onChange={(e) => setNewStageSla(Number(e.target.value))}
                  className="w-16 text-xs bg-white border border-slate-200 rounded px-2 py-1 font-mono"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Append Stage</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 6 Cols: Google Cloud Pub/Sub Work Queue & Configurable Reminders */}
        <div className="lg:col-span-6 space-y-5">
          {/* Configurable Reminder Rules Card */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-amber-600" />
                <span>Configurable Email &amp; Pub/Sub Reminder Policy</span>
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active Policy
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80 font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">
                  AUTO-REMIND AFTER
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {activeOrg?.reminderConfig.autoRemindAfterHours || 24}h
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">
                  ESCALATE OVERDUE
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {activeOrg?.reminderConfig.escalateOverdueHours || 48}h
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">
                  RECEIPT COPY
                </span>
                <span className="text-sm font-bold text-emerald-700">
                  AUTO-EMAIL
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                pushToast(
                  "Reminder Policy Verified",
                  "GCP Cloud Scheduler & Pub/Sub topic 'agencyos-email-notifications' synced.",
                  "success"
                )
              }
              className="text-xs font-medium text-slate-900 underline"
            >
              Test Cloud Scheduler Heartbeat →
            </button>
          </div>

          {/* Pub/Sub Work Queue Inspector */}
          <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HubOutlinedIcon sx={{ fontSize: 16 }} className="text-slate-800" />
                <span className="text-xs font-semibold text-slate-900">
                  Google Cloud Pub/Sub Work Queue ({filteredJobs.length})
                </span>
              </div>

              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-mono"
              >
                <option value="all">All Pub/Sub Topics</option>
                <option value="agencyos-approval-events">
                  agencyos-approval-events
                </option>
                <option value="agencyos-email-notifications">
                  agencyos-email-notifications
                </option>
                <option value="agencyos-social-publishing">
                  agencyos-social-publishing
                </option>
              </select>
            </div>

            <div className="divide-y divide-slate-200/80 max-h-96 overflow-y-auto">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-3.5 hover:bg-slate-50/70 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {job.topic}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      {job.status.toUpperCase()} ({job.messageId})
                    </span>
                  </div>

                  <div className="font-semibold text-slate-900">
                    {job.eventType}: {job.subject}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>Recipient: {job.recipient || "internal"}</span>
                    <span>
                      Provider:{" "}
                      <Server className="w-3 h-3 inline mr-0.5" />
                      {job.provider}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
