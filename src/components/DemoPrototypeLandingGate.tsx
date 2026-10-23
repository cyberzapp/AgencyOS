"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Info,
  Inbox,
  ExternalLink,
  History,
  BarChart3,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Layers,
  UserCheck,
} from "lucide-react";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { NavigationTab, useAgencyStore } from "@/store/useAgencyStore";

const DEMO_HIGHLIGHTS: Array<{
  tag: string;
  title: string;
  description: string;
  tab: NavigationTab;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    tag: "Feature A",
    title: "One Content Inbox",
    description:
      "Every deliverable tracks owner, deadline, client, status, and current version. Filter immediately by items needing internal QA, client sign-off, or revision.",
    tab: "inbox",
    icon: Inbox,
  },
  {
    tag: "Feature B",
    title: "Frictionless Client Approval Portal",
    description:
      "Clients open a secure zero-login link, inspect the asset, drop visual coordinate pins, and approve or request revisions without learning internal PM tools.",
    tab: "portal_preview",
    icon: ExternalLink,
  },
  {
    tag: "Feature C",
    title: "Version History & Approval Receipts",
    description:
      "Each approval is cryptographically bound to a specific asset version (SHA-256). If a designer modifies an approved file, AgencyOS requires a fresh approval.",
    tab: "versions_receipts",
    icon: History,
  },
  {
    tag: "Feature D",
    title: "Approval Bottleneck Report",
    description:
      "Executive visibility into pending approvals, overdue deliverables, average client response times (in hours), and revision counts per account.",
    tab: "bottlenecks",
    icon: BarChart3,
  },
];

export function DemoPrototypeLandingGate() {
  const {
    enterDashboard,
    setActiveTab,
    teamMembers,
    currentUser,
    switchUserRole,
    organizations,
    activeOrgId,
    switchOrganization,
    resetDemoData,
    isSyncing,
  } = useAgencyStore();

  const orgMembers = teamMembers.filter((m) => m.orgId === activeOrgId);

  const handleContinueToTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    enterDashboard();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col justify-between font-sans antialiased">
      {/* Top Prototype Notice Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-bold uppercase tracking-wider">
              <ScienceOutlinedIcon sx={{ fontSize: 13 }} />
              Prototype Environment
            </span>
            <span className="text-slate-200 font-medium">
              Interactive Software Prototype — Built Strictly for Demonstration
              &amp; Evaluation Purposes
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Pre-Seeded Demo Tenants • Simulated GCP Pub/Sub &amp; Firebase Engine
          </span>
        </div>
      </div>

      {/* Main Centered Landing Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="max-w-5xl w-full space-y-8">
          {/* Primary Hero & Explicit Prototype Disclaimer Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
            {/* Brand & Status Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono text-sm font-bold tracking-tight">
                  A/OS
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight text-slate-900">
                      AgencyOS
                    </h1>
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      v2.4 Interactive Demo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    AI-Powered Client Approval, Version Audit &amp; Delivery
                    Platform for Small Content Agencies
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>11 / 11 MVP Capabilities Interactive</span>
                </span>
              </div>
            </div>

            {/* Explicit Prototype & Demonstration Banner */}
            <div className="p-4 sm:p-5 rounded-xl bg-amber-50/90 border border-amber-300/90 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-amber-950">
                    Please Note: This is an Interactive Prototype for
                    Demonstration Purposes Only
                  </h2>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-200/80 text-amber-950 font-semibold">
                    Demo Mode Active
                  </span>
                </div>
                <p className="text-xs text-amber-900/90 leading-relaxed">
                  You are viewing a self-contained, interactive demonstration
                  prototype of the entire <strong>AgencyOS</strong> software
                  suite. All workflows — including deliverable version uploads,
                  cryptographic SHA-256 approval receipts, post-approval edit
                  invalidation, visual pin annotations, Gemini AI feedback
                  synthesis, Google Cloud Pub/Sub notification queues, and
                  multi-tenant role switching — are pre-populated with realistic
                  agency data so you can test every feature immediately without
                  configuring external cloud API keys.
                </p>
              </div>
            </div>

            {/* Value Proposition & Primary Continue CTA */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-1">
              <div className="lg:col-span-7 space-y-3">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  The Distinctive Product Experience
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 leading-tight">
                  Make client feedback actionable, traceable, and impossible to
                  lose.
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Instead of competing on generic AI content generation, AgencyOS
                  solves the hardest operational bottleneck for small creative
                  agencies: turning messy client reviews into version-locked
                  cryptographic approval receipts and structured designer
                  checklists.
                </p>

                {/* Primary CTA Button Row */}
                <div className="pt-3 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => enterDashboard()}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
                  >
                    <span>Continue to Main Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    href="/portal/tok_lumina_serum_2026"
                    className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                    <span>Test Zero-Login Client Portal</span>
                  </Link>

                  <button
                    onClick={() => resetDemoData()}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Demo Data</span>
                  </button>
                </div>
              </div>

              {/* Right 5 Cols: Interactive Persona & Tenant Pre-Selector */}
              <div className="lg:col-span-5 bg-[#FAF9F6] border border-slate-200/90 rounded-xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-slate-700" />
                    <span>Configure Your Demo Session</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase text-slate-500">
                    Switch Anytime Later
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                    1. Select Agency Organization Tenant
                  </label>
                  <select
                    value={activeOrgId}
                    onChange={(e) => switchOrganization(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.domain} • {org.planTier.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">
                    2. Select Demo Persona / RBAC Role
                  </label>
                  <select
                    value={currentUser.id}
                    onChange={(e) => switchUserRole(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900"
                  >
                    {orgMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.role.toUpperCase()} ({m.title})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <VerifiedOutlinedIcon
                      sx={{ fontSize: 14 }}
                      className="text-emerald-600"
                    />
                    Active Role: {currentUser.role.toUpperCase()}
                  </span>
                  <span>SHA-256 Audit Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Core Differentiator Quick-Launch Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
                Or Jump Directly to a Specific Prototype Module
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                Click any card to open that view in the dashboard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {DEMO_HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.tag}
                    onClick={() => handleContinueToTab(item.tab)}
                    className="text-left bg-white border border-slate-200/90 hover:border-slate-900 rounded-xl p-4 transition-all group flex flex-col justify-between gap-4 shadow-2xs cursor-pointer"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          {item.tag}
                        </span>
                        <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-900">
                      <span>Launch Module</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200/80 bg-white px-6 py-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <span>
              <strong>AgencyOS Prototype Build</strong> — Next.js + TypeScript •
              Firebase Auth &amp; Firestore • Google Cloud Pub/Sub • Gemini AI
            </span>
          </div>
          <button
            onClick={() => enterDashboard()}
            className="font-semibold text-slate-900 hover:underline flex items-center gap-1"
          >
            <span>Enter Main Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
