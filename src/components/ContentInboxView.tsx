"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Bell,
  Sparkles,
  Layers,
  MapPin,
  Columns,
  ShieldAlert,
  FileCheck2,
  UserPlus,
} from "lucide-react";
import VerifiedOutlinedIcon from "@mui/icons-material/VerifiedOutlined";
import FingerprintOutlinedIcon from "@mui/icons-material/FingerprintOutlined";
import { useAgencyStore } from "@/store/useAgencyStore";
import { Deliverable, DeliverableStatus } from "@/types/agency";

const STATUS_META: Record<
  DeliverableStatus,
  { label: string; badgeClass: string }
> = {
  draft: {
    label: "Draft",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  internal_review: {
    label: "Internal Review",
    badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  client_review: {
    label: "Needs Client Approval",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  changes_requested: {
    label: "Revision Needed",
    badgeClass: "bg-rose-50 text-rose-800 border-rose-200",
  },
  approved: {
    label: "Approved & Locked",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  published: {
    label: "Published",
    badgeClass: "bg-slate-900 text-white border-slate-900",
  },
};

const PRESET_ASSETS = [
  {
    label: "Lumina Skincare — Cool Travertine (v2)",
    url: "/assets/deliverables/lumina-skincare-v2.jpg",
    fileName: "lumina-cellular-serum-v2-travertine.jpg",
  },
  {
    label: "Lumina Skincare — Warm Terracotta (v1)",
    url: "/assets/deliverables/lumina-skincare-v1.jpg",
    fileName: "lumina-cellular-serum-v1-terracotta.jpg",
  },
  {
    label: "Kinetix Calibre 09 Titanium Watch",
    url: "/assets/deliverables/kinetix-watch-launch.jpg",
    fileName: "kinetix-calibre09-titanium.jpg",
  },
  {
    label: "Verde Specialty Coffee Packaging Mockup",
    url: "/assets/deliverables/verde-coffee-packaging.jpg",
    fileName: "verde-packaging-lineup.jpg",
  },
  {
    label: "Aetheria System 04 Brand Identity Spec",
    url: "/assets/deliverables/aether-brand-guidelines.svg",
    fileName: "aetheria-system04-spec.svg",
  },
];

export function ContentInboxView() {
  const {
    deliverables,
    clients,
    projects,
    activeOrgId,
    selectedDeliverableId,
    setSelectedDeliverableId,
    statusFilter,
    setStatusFilter,
    clientFilter,
    setClientFilter,
    searchQuery,
    setSearchQuery,
    submitApprovalDecision,
    uploadNewVersion,
    createDeliverable,
    createClientAndProject,
    sendApprovalReminder,
    toggleAiActionItem,
    setActiveTab,
  } = useAgencyStore();

  const [compareSideBySide, setCompareSideBySide] = useState(false);
  const [activeVersionView, setActiveVersionView] = useState<number | null>(null);
  const [pinCoords, setPinCoords] = useState<{ x: number; y: number } | null>({
    x: 52,
    y: 58,
  });
  const [feedbackComment, setFeedbackComment] = useState("");

  // Modals state
  const [showUploadVersionModal, setShowUploadVersionModal] = useState(false);
  const [newVerLabel, setNewVerLabel] = useState("");
  const [newVerSummary, setNewVerSummary] = useState("");
  const [newVerAssetIdx, setNewVerAssetIdx] = useState(0);

  const [showNewDeliverableModal, setShowNewDeliverableModal] = useState(false);
  const [newDelTitle, setNewDelTitle] = useState("");
  const [newDelDesc, setNewDelDesc] = useState("");
  const [newDelClientId, setNewDelClientId] = useState("");
  const [newDelChannel, setNewDelChannel] =
    useState<Deliverable["channel"]>("Instagram Feed");
  const [newDelPriority, setNewDelPriority] =
    useState<Deliverable["priority"]>("high");
  const [newDelAssetIdx, setNewDelAssetIdx] = useState(0);

  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [clientNameInput, setClientNameInput] = useState("");
  const [clientIndustryInput, setClientIndustryInput] = useState("Luxury Retail");
  const [contactNameInput, setContactNameInput] = useState("");
  const [contactEmailInput, setContactEmailInput] = useState("");
  const [projectNameInput, setProjectNameInput] = useState("");
  const [projectCodeInput, setProjectCodeInput] = useState("PRJ-26");

  // Tenant-isolated lists
  const orgDeliverables = deliverables.filter((d) => d.orgId === activeOrgId);
  const orgClients = clients.filter((c) => c.orgId === activeOrgId);
  const orgProjects = projects.filter((p) => p.orgId === activeOrgId);

  const filteredDeliverables = orgDeliverables.filter((d) => {
    if (statusFilter === "needs_reapproval") {
      if (!d.requiresReapproval) return false;
    } else if (statusFilter !== "all" && d.status !== statusFilter) {
      return false;
    }
    if (clientFilter !== "all" && d.clientId !== clientFilter) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.clientName.toLowerCase().includes(q) ||
        d.ownerName.toLowerCase().includes(q) ||
        d.projectName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedDeliverable =
    orgDeliverables.find((d) => d.id === selectedDeliverableId) ||
    filteredDeliverables[0] ||
    orgDeliverables[0];

  const displayedVersionNumber =
    activeVersionView &&
    selectedDeliverable?.versions.some(
      (v) => v.versionNumber === activeVersionView
    )
      ? activeVersionView
      : selectedDeliverable?.currentVersion || 1;

  const displayedVersion =
    selectedDeliverable?.versions.find(
      (v) => v.versionNumber === displayedVersionNumber
    ) ||
    selectedDeliverable?.versions[selectedDeliverable.versions.length - 1];

  const previousVersion =
    selectedDeliverable && selectedDeliverable.versions.length > 1
      ? selectedDeliverable.versions[0]
      : null;

  // Inbox summary counts
  const countClientApproval = orgDeliverables.filter(
    (d) => d.status === "client_review"
  ).length;
  const countRevisionOrReapproval = orgDeliverables.filter(
    (d) => d.status === "changes_requested" || d.requiresReapproval
  ).length;
  const countInternalReview = orgDeliverables.filter(
    (d) => d.status === "internal_review"
  ).length;
  const countApproved = orgDeliverables.filter(
    (d) => d.status === "approved"
  ).length;

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPinCoords({ x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) });
  };

  const handleUploadNewVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeliverable) return;
    const preset = PRESET_ASSETS[newVerAssetIdx] || PRESET_ASSETS[0];
    await uploadNewVersion({
      deliverableId: selectedDeliverable.id,
      label:
        newVerLabel.trim() ||
        `v${selectedDeliverable.currentVersion + 1}.0 — Updated Agency Cut`,
      fileName: preset.fileName,
      fileUrl: preset.url,
      fileSizeMb: 8.6,
      changeSummary:
        newVerSummary.trim() ||
        "Updated typography, color grading, and layout spacing per client review.",
    });
    setActiveVersionView(null);
    setNewVerLabel("");
    setNewVerSummary("");
    setShowUploadVersionModal(false);
  };

  const handleCreateDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClient =
      orgClients.find((c) => c.id === newDelClientId) || orgClients[0];
    const targetProject =
      orgProjects.find((p) => p.clientId === targetClient?.id) || orgProjects[0];
    const preset = PRESET_ASSETS[newDelAssetIdx] || PRESET_ASSETS[0];

    await createDeliverable({
      clientId: targetClient?.id || "cli_lumina",
      projectId: targetProject?.id || "prj_lumina_q4",
      title: newDelTitle.trim() || "Q4 Campaign Hero Keyframe",
      description:
        newDelDesc.trim() ||
        "Deliverable asset with cryptographic SHA-256 version tracking.",
      channel: newDelChannel,
      assetType: "image",
      priority: newDelPriority,
      deadline: "2026-10-30T18:00:00.000Z",
      fileUrl: preset.url,
      fileName: preset.fileName,
      invoiceMilestoneUsd: 4200,
    });
    setNewDelTitle("");
    setNewDelDesc("");
    setShowNewDeliverableModal(false);
  };

  const handleCreateClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientNameInput.trim() || !contactEmailInput.trim()) return;
    await createClientAndProject({
      clientName: clientNameInput.trim(),
      industry: clientIndustryInput.trim(),
      contactName: contactNameInput.trim() || "Brand Director",
      contactEmail: contactEmailInput.trim(),
      retainerMonthlyUsd: 12000,
      projectName: projectNameInput.trim() || "2026 Retainer Launch",
      projectCode: projectCodeInput.trim() || "RET-26",
    });
    setClientNameInput("");
    setContactNameInput("");
    setContactEmailInput("");
    setProjectNameInput("");
    setShowNewClientModal(false);
  };

  const isOverdue = (deadlineIso: string, status: DeliverableStatus) => {
    if (status === "approved" || status === "published") return false;
    return new Date(deadlineIso).getTime() < new Date("2026-10-23T10:00:00Z").getTime();
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header & Primary Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white">
              Feature A
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              One Content Inbox
            </h1>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Every deliverable has an owner, deadline, client, status, and
            cryptographic version receipt. Nothing slips through Slack or email threads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowNewClientModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Client &amp; Project</span>
          </button>
          <button
            onClick={() => setShowNewDeliverableModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Deliverable</span>
          </button>
        </div>
      </div>

      {/* 4 High-Signal Inbox Triage Strip Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={() =>
            setStatusFilter(
              statusFilter === "client_review" ? "all" : "client_review"
            )
          }
          className={`text-left p-4 rounded-xl border transition-all bg-white ${
            statusFilter === "client_review"
              ? "border-slate-900 ring-1 ring-slate-900"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Needs Client Approval</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono text-slate-900">
              {countClientApproval}
            </span>
            <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Portal Active
            </span>
          </div>
        </button>

        <button
          onClick={() =>
            setStatusFilter(
              statusFilter === "changes_requested" ? "all" : "changes_requested"
            )
          }
          className={`text-left p-4 rounded-xl border transition-all bg-white ${
            statusFilter === "changes_requested"
              ? "border-slate-900 ring-1 ring-slate-900"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Revisions &amp; Re-Approvals</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono text-slate-900">
              {countRevisionOrReapproval}
            </span>
            <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              AI Triaged
            </span>
          </div>
        </button>

        <button
          onClick={() =>
            setStatusFilter(
              statusFilter === "internal_review" ? "all" : "internal_review"
            )
          }
          className={`text-left p-4 rounded-xl border transition-all bg-white ${
            statusFilter === "internal_review"
              ? "border-slate-900 ring-1 ring-slate-900"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Needs Internal Review</span>
            <Eye className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono text-slate-900">
              {countInternalReview}
            </span>
            <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              Director QA
            </span>
          </div>
        </button>

        <button
          onClick={() =>
            setStatusFilter(statusFilter === "approved" ? "all" : "approved")
          }
          className={`text-left p-4 rounded-xl border transition-all bg-white ${
            statusFilter === "approved"
              ? "border-slate-900 ring-1 ring-slate-900"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Approved &amp; Receipt Locked</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-semibold font-mono text-slate-900">
              {countApproved}
            </span>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              SHA-256 Verified
            </span>
          </div>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: "all", label: "All Deliverables" },
              { id: "client_review", label: "Client Approval" },
              { id: "changes_requested", label: "Needs Revision" },
              { id: "needs_reapproval", label: "Modified Post-Approval" },
              { id: "internal_review", label: "Internal QA" },
              { id: "approved", label: "Approved" },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === pill.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Filter by Client"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700"
          >
            <option value="all">All Clients</option>
            {orgClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverables, owner..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Main Split Grid: Left Inbox Table + Right Deliverable Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 5 Cols: Deliverable Inbox List */}
        <div className="xl:col-span-5 bg-white border border-slate-200/90 rounded-xl overflow-hidden divide-y divide-slate-200/80">
          <div className="px-4 py-3 bg-slate-50/70 flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
              Deliverables Queue ({filteredDeliverables.length})
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Owner • Deadline • Version
            </span>
          </div>

          {filteredDeliverables.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-slate-500">
                No deliverables match the selected filter.
              </p>
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setClientFilter("all");
                  setSearchQuery("");
                }}
                className="mt-3 text-xs font-medium text-slate-900 underline"
              >
                Reset Inbox Filters
              </button>
            </div>
          ) : (
            filteredDeliverables.map((item) => {
              const isSelected = selectedDeliverable?.id === item.id;
              const statusInfo = STATUS_META[item.status];
              const overdue = isOverdue(item.deadline, item.status);

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedDeliverableId(item.id);
                    setActiveVersionView(null);
                  }}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-900/[0.03] border-l-4 border-l-slate-900"
                      : "hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-mono font-semibold text-slate-600">
                          {item.clientName}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500">
                          {item.channel}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <span className="shrink-0 font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      v{item.currentVersion}.0
                    </span>
                  </div>

                  {/* Re-approval warning banner if approved file was changed */}
                  {item.requiresReapproval && (
                    <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200/90 flex items-center gap-2 text-[11px] text-amber-900">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        <strong>Re-Approval Required:</strong> File modified in v
                        {item.currentVersion}.0 after v
                        {item.previousApprovedVersion || 1}.0 approval.
                      </span>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>
                      {overdue && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-600 text-white font-semibold">
                          OVERDUE
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Owner: {item.ownerName.split(" ")[0]}</span>
                      <span>
                        Due{" "}
                        {new Date(item.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 7 Cols: Selected Deliverable Inspector, Version Diff & AI Checklist */}
        {selectedDeliverable && displayedVersion && (
          <div className="xl:col-span-7 space-y-5">
            {/* Deliverable Header Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-slate-700">
                      {selectedDeliverable.clientName}
                    </span>
                    <span className="text-slate-300">/</span>
                    <span className="text-xs text-slate-500">
                      {selectedDeliverable.projectName}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                        STATUS_META[selectedDeliverable.status].badgeClass
                      }`}
                    >
                      {STATUS_META[selectedDeliverable.status].label}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-slate-900 mt-1">
                    {selectedDeliverable.title}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedDeliverable.description}
                  </p>
                </div>

                {/* Action Cluster */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowUploadVersionModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      Upload v{selectedDeliverable.currentVersion + 1}.0
                    </span>
                  </button>

                  <Link
                    href={`/portal/${selectedDeliverable.shareToken}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Client Review Link</span>
                  </Link>
                </div>
              </div>

              {/* Metadata & Version Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/80 p-3 rounded-lg border border-slate-200/70">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Owner
                  </div>
                  <div className="font-medium text-slate-900 mt-0.5">
                    {selectedDeliverable.ownerName}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Deadline
                  </div>
                  <div className="font-mono font-medium text-slate-900 mt-0.5">
                    {new Date(selectedDeliverable.deadline).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Version SHA-256
                  </div>
                  <div className="font-mono text-[11px] text-slate-700 mt-0.5 flex items-center gap-1">
                    <FingerprintOutlinedIcon sx={{ fontSize: 13 }} />
                    {displayedVersion.fileSha256.slice(0, 12)}...
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400">
                    Turnaround / Revs
                  </div>
                  <div className="font-mono font-medium text-slate-900 mt-0.5">
                    {selectedDeliverable.turnaroundHours}h •{" "}
                    {selectedDeliverable.revisionCount} rev
                  </div>
                </div>
              </div>

              {/* Re-Approval Alert Box when an approved asset was modified */}
              {selectedDeliverable.requiresReapproval && (
                <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                    <div className="text-xs text-amber-950">
                      <span className="font-semibold">
                        Cryptographic Receipt Guardrail Triggered:
                      </span>{" "}
                      Version v{selectedDeliverable.previousApprovedVersion}.0 was
                      previously approved, but the designer uploaded modified file{" "}
                      <span className="font-mono font-semibold">
                        v{selectedDeliverable.currentVersion}.0
                      </span>
                      . AgencyOS requires a fresh client approval receipt for v
                      {selectedDeliverable.currentVersion}.0 before delivery.
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      sendApprovalReminder(selectedDeliverable.id)
                    }
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900 text-white text-xs font-medium hover:bg-amber-800"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Ping Client</span>
                  </button>
                </div>
              )}

              {/* Version Selector & Side-by-Side Diff Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono uppercase text-slate-500 mr-1 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    Versions:
                  </span>
                  {selectedDeliverable.versions.map((ver) => (
                    <button
                      key={ver.id}
                      onClick={() => setActiveVersionView(ver.versionNumber)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
                        displayedVersion.versionNumber === ver.versionNumber
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      v{ver.versionNumber}.0
                      {ver.receiptId ? " ✓" : ""}
                    </button>
                  ))}
                </div>

                {selectedDeliverable.versions.length > 1 && (
                  <button
                    onClick={() => setCompareSideBySide(!compareSideBySide)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      compareSideBySide
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>
                      {compareSideBySide
                        ? "Exit Side-by-Side Diff"
                        : "Compare v1.0 vs Latest"}
                    </span>
                  </button>
                )}
              </div>

              {/* Interactive Visual Asset Canvas (Single or Side-by-Side Comparison) */}
              {compareSideBySide && previousVersion ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-slate-700">
                        {previousVersion.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        SHA: {previousVersion.fileSha256.slice(0, 8)}
                      </span>
                    </div>
                    <div className="aspect-[4/3] relative bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={previousVersion.fileUrl}
                        alt={previousVersion.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2.5 text-[11px] text-slate-600 bg-white border-t border-slate-200">
                      {previousVersion.changeSummary}
                    </div>
                  </div>

                  <div className="border-2 border-slate-900 rounded-xl overflow-hidden bg-slate-50">
                    <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold">
                        {displayedVersion.label} (Current)
                      </span>
                      <span className="text-[10px] font-mono text-slate-300">
                        SHA: {displayedVersion.fileSha256.slice(0, 8)}
                      </span>
                    </div>
                    <div className="aspect-[4/3] relative bg-slate-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={displayedVersion.fileUrl}
                        alt={displayedVersion.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2.5 text-[11px] text-slate-700 bg-white border-t border-slate-200">
                      {displayedVersion.changeSummary}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950/5">
                  <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-slate-800">
                        {displayedVersion.label}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        ({displayedVersion.dimensions} •{" "}
                        {displayedVersion.fileSizeMb} MB)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      Click anywhere on asset to place feedback pin
                    </span>
                  </div>

                  <div
                    onClick={handleCanvasClick}
                    className="relative max-h-[420px] bg-slate-900 flex items-center justify-center overflow-hidden cursor-crosshair select-none"
                  >
                    <img
                      src={displayedVersion.fileUrl}
                      alt={displayedVersion.label}
                      className="w-full max-h-[420px] object-contain"
                    />

                    {/* Existing comment pins for this version */}
                    {selectedDeliverable.comments
                      .filter(
                        (c) =>
                          c.versionNumber === displayedVersion.versionNumber &&
                          c.pinX !== undefined &&
                          c.pinY !== undefined
                      )
                      .map((c, idx) => (
                        <div
                          key={c.id}
                          style={{ left: `${c.pinX}%`, top: `${c.pinY}%` }}
                          title={`${c.authorName}: ${c.content}`}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-900 text-white border-2 border-white shadow-md flex items-center justify-center text-[10px] font-mono font-bold"
                        >
                          {idx + 1}
                        </div>
                      ))}

                    {/* Active placement pin */}
                    {pinCoords && (
                      <div
                        style={{
                          left: `${pinCoords.x}%`,
                          top: `${pinCoords.y}%`,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 border-2 border-white shadow-lg text-[10px] font-mono font-bold flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>
                          {pinCoords.x}%, {pinCoords.y}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-600">
                      <strong>Version Note:</strong>{" "}
                      {displayedVersion.changeSummary}
                    </span>
                    {displayedVersion.receiptId && (
                      <button
                        onClick={() => setActiveTab("versions_receipts")}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                      >
                        <VerifiedOutlinedIcon sx={{ fontSize: 13 }} />
                        Receipt {displayedVersion.receiptId}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Approval / Revision Action Bar */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-slate-700" />
                    <span>
                      Record Decision or Pin Feedback on v
                      {selectedDeliverable.currentVersion}.0
                    </span>
                  </label>
                  {pinCoords && (
                    <span className="text-[11px] font-mono text-slate-500">
                      Pin Attached: ({pinCoords.x}%, {pinCoords.y}%)
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Leave approval notes or specific revision requests (Gemini AI will automatically extract designer tasks)..."
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => sendApprovalReminder(selectedDeliverable.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Send Pub/Sub Reminder</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        await submitApprovalDecision({
                          deliverableId: selectedDeliverable.id,
                          decision: "changes_requested",
                          comment:
                            feedbackComment.trim() ||
                            "Please refine the contrast on the headline and adjust padding around the hero bottle.",
                          pinX: pinCoords?.x,
                          pinY: pinCoords?.y,
                        });
                        setFeedbackComment("");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs font-medium hover:bg-amber-100 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      <span>Request Revisions (AI Triage)</span>
                    </button>

                    <button
                      onClick={async () => {
                        await submitApprovalDecision({
                          deliverableId: selectedDeliverable.id,
                          decision: "approved",
                          comment:
                            feedbackComment.trim() ||
                            `Approved v${selectedDeliverable.currentVersion}.0 for production release.`,
                          pinX: pinCoords?.x,
                          pinY: pinCoords?.y,
                        });
                        setFeedbackComment("");
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        Approve v{selectedDeliverable.currentVersion}.0 &amp; Sign
                        Receipt
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Actionable Feedback & AI Designer Checklist */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>
                      Traceable Client Feedback &amp; AI Action Checklist (
                      {selectedDeliverable.comments.length})
                    </span>
                  </h3>
                </div>

                {selectedDeliverable.comments.length === 0 ? (
                  <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-500">
                    No revision comments recorded on this deliverable yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDeliverable.comments.map((cmt, idx) => (
                      <div
                        key={cmt.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200/90 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {cmt.authorName}
                            </span>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {cmt.authorRole} • v{cmt.versionNumber}.0
                            </span>
                            {cmt.pinX !== undefined && (
                              <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Pin ({cmt.pinX}%, {cmt.pinY}%)
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            {new Date(cmt.createdAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed pl-7">
                          &ldquo;{cmt.content}&rdquo;
                        </p>

                        {cmt.aiActionItems.length > 0 && (
                          <div className="ml-7 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                            <div className="text-[10px] font-mono uppercase text-slate-500 flex items-center justify-between">
                              <span>
                                AI-Extracted Actionable Designer Checklist
                              </span>
                              <span>Click to toggle completion</span>
                            </div>
                            {cmt.aiActionItems.map((task) => (
                              <label
                                key={task.id}
                                className="flex items-start gap-2 text-xs cursor-pointer group"
                              >
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() =>
                                    toggleAiActionItem(
                                      selectedDeliverable.id,
                                      cmt.id,
                                      task.id
                                    )
                                  }
                                  className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                />
                                <span
                                  className={`flex-1 ${
                                    task.completed
                                      ? "line-through text-slate-400"
                                      : "text-slate-800 group-hover:text-slate-950"
                                  }`}
                                >
                                  {task.task}
                                </span>
                                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                                  {task.category}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Upload New Version */}
      {showUploadVersionModal && selectedDeliverable && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Upload Version v{selectedDeliverable.currentVersion + 1}.0
              </h3>
              <button
                onClick={() => setShowUploadVersionModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            {selectedDeliverable.status === "approved" && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>Notice (Rule C):</strong> This deliverable is currently
                Approved on v{selectedDeliverable.currentVersion}.0. Uploading v
                {selectedDeliverable.currentVersion + 1}.0 will supersede the
                existing approval receipt and require a new client approval!
              </div>
            )}

            <form onSubmit={handleUploadNewVersionSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Version Label
                </label>
                <input
                  type="text"
                  required
                  value={newVerLabel}
                  onChange={(e) => setNewVerLabel(e.target.value)}
                  placeholder={`v${selectedDeliverable.currentVersion + 1}.0 — Revised Color & Grid`}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Creative Asset File
                </label>
                <select
                  value={newVerAssetIdx}
                  onChange={(e) => setNewVerAssetIdx(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white"
                >
                  {PRESET_ASSETS.map((a, i) => (
                    <option key={a.fileName} value={i}>
                      {a.label} ({a.fileName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  What Changed in This Version?
                </label>
                <textarea
                  rows={3}
                  required
                  value={newVerSummary}
                  onChange={(e) => setNewVerSummary(e.target.value)}
                  placeholder="Describe adjustments made for the client and audit trail..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadVersionModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                >
                  Compute SHA-256 &amp; Upload v
                  {selectedDeliverable.currentVersion + 1}.0
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create New Deliverable */}
      {showNewDeliverableModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Upload New Deliverable to Inbox
              </h3>
              <button
                onClick={() => setShowNewDeliverableModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateDeliverableSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Deliverable Title
                </label>
                <input
                  type="text"
                  required
                  value={newDelTitle}
                  onChange={(e) => setNewDelTitle(e.target.value)}
                  placeholder="e.g., Holiday Edition Packaging Keyframe"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Client
                  </label>
                  <select
                    value={newDelClientId}
                    onChange={(e) => setNewDelClientId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
                  >
                    {orgClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Channel
                  </label>
                  <select
                    value={newDelChannel}
                    onChange={(e) =>
                      setNewDelChannel(e.target.value as Deliverable["channel"])
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
                  >
                    <option value="Instagram Feed">Instagram Feed</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="Packaging & Print">Packaging &amp; Print</option>
                    <option value="Brand Guidelines">Brand Guidelines</option>
                    <option value="Web Campaign">Web Campaign</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newDelPriority}
                    onChange={(e) =>
                      setNewDelPriority(
                        e.target.value as Deliverable["priority"]
                      )
                    }
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Initial Studio Asset
                  </label>
                  <select
                    value={newDelAssetIdx}
                    onChange={(e) => setNewDelAssetIdx(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
                  >
                    {PRESET_ASSETS.map((a, i) => (
                      <option key={a.fileName} value={i}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Deliverable Brief &amp; Scope Notes
                </label>
                <textarea
                  rows={2}
                  value={newDelDesc}
                  onChange={(e) => setNewDelDesc(e.target.value)}
                  placeholder="Context for internal QA and client reviewers..."
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewDeliverableModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                >
                  Create &amp; Issue Portal Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create Client & Project */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Onboard Client &amp; Initialize Project
              </h3>
              <button
                onClick={() => setShowNewClientModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateClientSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Client Brand Name
                </label>
                <input
                  type="text"
                  required
                  value={clientNameInput}
                  onChange={(e) => setClientNameInput(e.target.value)}
                  placeholder="e.g., Maison Solis"
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Stakeholder Name
                  </label>
                  <input
                    type="text"
                    required
                    value={contactNameInput}
                    onChange={(e) => setContactNameInput(e.target.value)}
                    placeholder="Camille Laurent"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Stakeholder Email
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmailInput}
                    onChange={(e) => setContactEmailInput(e.target.value)}
                    placeholder="camille@maisonsolis.fr"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Initial Project Name
                  </label>
                  <input
                    type="text"
                    required
                    value={projectNameInput}
                    onChange={(e) => setProjectNameInput(e.target.value)}
                    placeholder="SS27 Campaign Launch"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Project Code
                  </label>
                  <input
                    type="text"
                    required
                    value={projectCodeInput}
                    onChange={(e) => setProjectCodeInput(e.target.value)}
                    placeholder="SOL-27"
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
                >
                  Create Client &amp; Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
