"use client";

import React from "react";
import {
  Inbox,
  ExternalLink,
  History,
  BarChart3,
  GitBranch,
  Share2,
  Sparkles,
  Building2,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  UserCheck,
  X,
} from "lucide-react";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import CloudDoneOutlinedIcon from "@mui/icons-material/CloudDoneOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import { NavigationTab, useAgencyStore } from "@/store/useAgencyStore";

const NAV_ITEMS: Array<{
  id: NavigationTab;
  label: string;
  shortTag: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "core" | "suite";
}> = [
  {
    id: "inbox",
    label: "Content Inbox",
    shortTag: "A",
    icon: Inbox,
    section: "core",
  },
  {
    id: "portal_preview",
    label: "Client Approval Portal",
    shortTag: "B",
    icon: ExternalLink,
    section: "core",
  },
  {
    id: "versions_receipts",
    label: "Versions & Receipts",
    shortTag: "C",
    icon: History,
    section: "core",
  },
  {
    id: "bottlenecks",
    label: "Bottleneck Report",
    shortTag: "D",
    icon: BarChart3,
    section: "core",
  },
  {
    id: "workflow_builder",
    label: "Workflow & Pub/Sub",
    shortTag: "QUEUE",
    icon: GitBranch,
    section: "suite",
  },
  {
    id: "social_invoicing",
    label: "Social & Invoicing",
    shortTag: "PUBLISH",
    icon: Share2,
    section: "suite",
  },
  {
    id: "ai_copilot",
    label: "AI Feedback Copilot",
    shortTag: "GEMINI",
    icon: Sparkles,
    section: "suite",
  },
  {
    id: "org_billing_mvp",
    label: "Org, Billing & 11 MVP",
    shortTag: "11/11",
    icon: Building2,
    section: "suite",
  },
];

export function SidebarAndHeader({ children }: { children: React.ReactNode }) {
  const {
    activeTab,
    setActiveTab,
    returnToDemoGate,
    resetDemoData,
    organizations,
    activeOrgId,
    switchOrganization,
    currentUser,
    teamMembers,
    switchUserRole,
    loginWithGoogle,
    logout,
    isAuthenticated,
    authProviderLabel,
    deliverables,
    pubsubJobs,
    toasts,
    dismissToast,
  } = useAgencyStore();

  const activeOrg =
    organizations.find((o) => o.id === activeOrgId) || organizations[0];
  const orgDeliverables = deliverables.filter((d) => d.orgId === activeOrgId);
  const pendingClientCount = orgDeliverables.filter(
    (d) => d.status === "client_review" || d.requiresReapproval
  ).length;
  const orgMembers = teamMembers.filter((m) => m.orgId === activeOrgId);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col lg:flex-row font-sans antialiased">
      {/* Left Minimalist Architectural Rail */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200/90 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-bold tracking-tight">
                A/OS
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-sm tracking-tight text-slate-900">
                    AgencyOS
                  </span>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    v2.4
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Approval &amp; Receipt Ledger
                </p>
              </div>
            </div>
          </div>

          {/* Organization Tenant Switcher */}
          <div className="px-4 py-3.5 border-b border-slate-200/80 bg-slate-50/60">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
              Active Organization Tenant
            </label>
            <select
              aria-label="Select Organization Tenant"
              value={activeOrgId}
              onChange={(e) => switchOrganization(e.target.value)}
              className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name} ({org.planTier.toUpperCase()})
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Tenant: {activeOrg?.slug}</span>
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <VerifiedUserOutlinedIcon sx={{ fontSize: 12 }} />
                Isolated
              </span>
            </div>
          </div>

          {/* Core Differentiator Nav */}
          <div className="p-3 space-y-5">
            <div>
              <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Core Approval System
              </div>
              <nav className="space-y-0.5">
                {NAV_ITEMS.filter((i) => i.section === "core").map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.id === "inbox" && pendingClientCount > 0
                          ? `${pendingClientCount} due`
                          : item.shortTag}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div>
              <div className="px-2.5 mb-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Platform &amp; GCP Suite
              </div>
              <nav className="space-y-0.5">
                {NAV_ITEMS.filter((i) => i.section === "suite").map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isActive
                            ? "bg-white/15 text-white"
                            : item.id === "org_billing_mvp"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.shortTag}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom GCP Status & Role Switcher */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 space-y-3">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-slate-500 flex items-center gap-1">
                <CloudDoneOutlinedIcon sx={{ fontSize: 13 }} />
                GCP / Firebase
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                RESILIENT
              </span>
            </div>
            <div className="text-[11px] text-slate-600 flex items-center justify-between font-mono">
              <span>Pub/Sub Queue</span>
              <span>{pubsubJobs.length} acked</span>
            </div>
          </div>

          {/* Active User & Role Switcher */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
              Simulate Role / Identity
            </label>
            <select
              aria-label="Switch Active Role"
              value={currentUser.id}
              onChange={(e) => switchUserRole(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800 font-medium"
            >
              {orgMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.role.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Minimalist Header Bar */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => returnToDemoGate()}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
              title="Return to Prototype Landing Page"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span>← Prototype Overview</span>
            </button>
            <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 hidden sm:inline">
              {activeOrg?.name}
            </span>
            <button
              onClick={() => resetDemoData()}
              className="text-[11px] font-mono text-slate-500 hover:text-slate-900 underline hidden lg:inline cursor-pointer"
            >
              Reset Demo State
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* MVP 11/11 Quick Pill */}
            <button
              onClick={() => setActiveTab("org_billing_mvp")}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>11 / 11 MVP Capabilities Checked</span>
            </button>

            {/* Google Auth Identity Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                  {currentUser.avatarInitials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-medium text-slate-900 leading-none">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {currentUser.role.toUpperCase()} • {authProviderLabel.split(" ")[0]}
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  title="Sign out"
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => loginWithGoogle()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <GoogleIcon sx={{ fontSize: 14 }} />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </header>

        {/* Workspace View Container */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Floating Toast Notification Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto p-3.5 rounded-xl border shadow-lg bg-white flex items-start justify-between gap-3 transition-all ${
                t.variant === "success"
                  ? "border-emerald-300"
                  : t.variant === "warning"
                  ? "border-amber-300"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <ShieldCheck
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    t.variant === "success"
                      ? "text-emerald-600"
                      : t.variant === "warning"
                      ? "text-amber-600"
                      : "text-slate-700"
                  }`}
                />
                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    {t.title}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                    {t.description}
                  </div>
                </div>
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
