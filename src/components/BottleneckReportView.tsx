"use client";

import React from "react";
import {
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Bell,
  Download,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import { useAgencyStore } from "@/store/useAgencyStore";

export function BottleneckReportView() {
  const {
    deliverables,
    clients,
    activeOrgId,
    sendApprovalReminder,
    setSelectedDeliverableId,
    setActiveTab,
    pushToast,
  } = useAgencyStore();

  const orgDeliverables = deliverables.filter((d) => d.orgId === activeOrgId);
  const orgClients = clients.filter((c) => c.orgId === activeOrgId);

  const pendingApprovals = orgDeliverables.filter(
    (d) => d.status === "client_review" || d.requiresReapproval
  );

  const overdueDeliverables = orgDeliverables.filter((d) => {
    if (d.status === "approved" || d.status === "published") return false;
    return (
      new Date(d.deadline).getTime() < new Date("2026-10-23T12:00:00Z").getTime()
    );
  });

  const avgResponseHours =
    orgClients.length > 0
      ? (
          orgClients.reduce((acc, c) => acc + c.avgResponseTimeHours, 0) /
          orgClients.length
        ).toFixed(1)
      : "18.2";

  const totalRevisions = orgDeliverables.reduce(
    (acc, d) => acc + d.revisionCount,
    0
  );

  const avgRevisionsPerAsset =
    orgDeliverables.length > 0
      ? (totalRevisions / orgDeliverables.length).toFixed(1)
      : "1.2";

  const handleExportReport = () => {
    const reportPayload = {
      generatedAt: new Date().toISOString(),
      organizationId: activeOrgId,
      kpis: {
        pendingApprovals: pendingApprovals.length,
        overdueDeliverables: overdueDeliverables.length,
        avgClientResponseHours: Number(avgResponseHours),
        totalRevisions,
      },
      clientTurnaroundBreakdown: orgClients.map((c) => ({
        client: c.name,
        avgResponseTimeHours: c.avgResponseTimeHours,
        revisionRateAvg: c.revisionRateAvg,
        pendingCount: c.pendingApprovalsCount,
      })),
    };
    navigator.clipboard?.writeText(JSON.stringify(reportPayload, null, 2));
    pushToast(
      "Executive Bottleneck Report Exported",
      "JSON analytics snapshot copied to clipboard for agency partners.",
      "success"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
              Feature D
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Approval Bottleneck &amp; Turnaround Report
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Executive visibility into pending approvals, overdue deliverables,
            average client response times, and revision counts per account.
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Executive Report (JSON/CSV)</span>
        </button>
      </div>

      {/* 4 Executive Bottleneck KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-slate-900">
              {pendingApprovals.length}
            </span>
            <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Blocking Delivery
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Includes assets awaiting initial sign-off or post-edit re-approval.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Overdue Deliverables</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-rose-700">
              {overdueDeliverables.length}
            </span>
            <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              SLA Breached
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Auto-escalation reminders active via Google Cloud Pub/Sub.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Avg Client Response Time</span>
            <SpeedOutlinedIcon sx={{ fontSize: 16 }} className="text-slate-700" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-slate-900">
              {avgResponseHours}h
            </span>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              -34% vs Email
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Measured from portal link dispatch to signed SHA-256 receipt.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Revision Cycles</span>
            <RotateCcw className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-slate-900">
              {totalRevisions}{" "}
              <span className="text-xs font-normal text-slate-500">
                ({avgRevisionsPerAsset} avg)
              </span>
            </span>
            <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Tracked
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            AI checklist extraction reduces multi-round revision churn.
          </p>
        </div>
      </div>

      {/* Split Grid: Left Client Response Time Leaderboard + Right Overdue & Pending Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Client Response Time & Revision Velocity */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-700" />
                <span>Client Response Time &amp; Revision Bottlenecks</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Identifies which client stakeholders hold up agency delivery
                schedules.
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase text-slate-400">
              Target SLA: &lt; 24h
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {[...orgClients]
              .sort((a, b) => b.avgResponseTimeHours - a.avgResponseTimeHours)
              .map((cli) => {
                const barWidth = Math.min(
                  100,
                  Math.round((cli.avgResponseTimeHours / 60) * 100)
                );
                const isSlow = cli.avgResponseTimeHours > 30;

                return (
                  <div
                    key={cli.id}
                    className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                          {cli.logoInitials}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {cli.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Stakeholder: {cli.contactName} ({cli.contactEmail})
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span
                          className={`text-sm font-bold ${
                            isSlow ? "text-rose-700" : "text-slate-900"
                          }`}
                        >
                          {cli.avgResponseTimeHours}h
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          avg turnaround
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className={`h-full rounded-full ${
                          isSlow
                            ? "bg-rose-600"
                            : cli.avgResponseTimeHours > 20
                            ? "bg-amber-500"
                            : "bg-emerald-600"
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-0.5">
                      <span>Avg Revisions: {cli.revisionRateAvg}x / asset</span>
                      <span>Approved Assets: {cli.totalApproved}</span>
                      <span>
                        Retainer: ${cli.retainerMonthlyUsd.toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right 6 Cols: Overdue & Pending Bottleneck Action Table */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Deliverable Turnaround &amp; Escalation Ledger
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Trigger instant Pub/Sub email reminders or jump to the asset
                inspector.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-200/80 border border-slate-200 rounded-xl overflow-hidden">
            {orgDeliverables.map((del) => {
              const overdue =
                del.status !== "approved" &&
                new Date(del.deadline).getTime() <
                  new Date("2026-10-23T12:00:00Z").getTime();

              return (
                <div
                  key={del.id}
                  className="p-3.5 bg-white hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-mono font-semibold text-slate-700">
                        {del.clientName}
                      </span>
                      {overdue && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-600 text-white font-semibold">
                          OVERDUE ({del.turnaroundHours}h elapsed)
                        </span>
                      )}
                      {del.requiresReapproval && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                          Re-Approval Needed
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-900">
                      {del.title} (v{del.currentVersion}.0)
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Owner: {del.ownerName} • Revisions: {del.revisionCount} •
                      Wait Time: {del.turnaroundHours}h
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {del.status !== "approved" ? (
                      <button
                        onClick={() => sendApprovalReminder(del.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium hover:bg-amber-100"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Remind</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved
                      </span>
                    )}

                    <button
                      onClick={() => {
                        setSelectedDeliverableId(del.id);
                        setActiveTab("inbox");
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <span>Inspect</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
