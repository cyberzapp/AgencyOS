"use client";

import { create } from "zustand";
import {
  AgencyStateSnapshot,
  DeliverableStatus,
  Role,
  TeamMember,
  WorkflowStage,
} from "@/types/agency";
import { createInitialAgencySnapshot } from "@/lib/seed-data";
import {
  signInWithGoogleIdentity,
  signOutGoogleIdentity,
} from "@/lib/firebase-client";

export type NavigationTab =
  | "inbox"
  | "portal_preview"
  | "versions_receipts"
  | "bottlenecks"
  | "workflow_builder"
  | "social_invoicing"
  | "ai_copilot"
  | "org_billing_mvp";

interface ToastNotification {
  id: string;
  title: string;
  description: string;
  variant: "default" | "success" | "warning";
}

interface AgencyStore extends AgencyStateSnapshot {
  hasEnteredDashboard: boolean;
  activeTab: NavigationTab;
  selectedDeliverableId: string;
  statusFilter: DeliverableStatus | "all" | "needs_reapproval";
  clientFilter: string | "all";
  searchQuery: string;
  isAuthenticated: boolean;
  authProviderLabel: string;
  isSyncing: boolean;
  lastFallbackUsed: boolean;
  toasts: ToastNotification[];

  // Demo Gate & Navigation
  enterDashboard: () => void;
  returnToDemoGate: () => void;
  resetDemoData: () => Promise<void>;
  setActiveTab: (tab: NavigationTab) => void;
  setSelectedDeliverableId: (id: string) => void;
  setStatusFilter: (status: DeliverableStatus | "all" | "needs_reapproval") => void;
  setClientFilter: (clientId: string | "all") => void;
  setSearchQuery: (q: string) => void;
  pushToast: (
    title: string,
    description: string,
    variant?: ToastNotification["variant"]
  ) => void;
  dismissToast: (id: string) => void;

  // Auth & Multi-Tenant Isolation
  loginWithGoogle: (presetMember?: TeamMember) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => void;
  switchUserRole: (memberId: string) => void;

  // Server Sync & Mutations
  hydrateFromServer: () => Promise<void>;
  submitApprovalDecision: (params: {
    deliverableId: string;
    decision: "approved" | "changes_requested" | "rejected";
    comment: string;
    reviewerName?: string;
    reviewerEmail?: string;
    reviewerRole?: Role;
    pinX?: number;
    pinY?: number;
  }) => Promise<void>;
  uploadNewVersion: (params: {
    deliverableId: string;
    label: string;
    fileName: string;
    fileUrl: string;
    fileSizeMb: number;
    changeSummary: string;
  }) => Promise<void>;
  createDeliverable: (params: {
    clientId: string;
    projectId: string;
    title: string;
    description: string;
    channel:
      | "Instagram Feed"
      | "Instagram Reels"
      | "TikTok"
      | "LinkedIn"
      | "Packaging & Print"
      | "Brand Guidelines"
      | "Web Campaign";
    assetType: "image" | "video" | "carousel" | "pdf_deck" | "copy_doc";
    priority: "urgent" | "high" | "medium" | "low";
    deadline: string;
    fileUrl?: string;
    fileName?: string;
    invoiceMilestoneUsd?: number;
  }) => Promise<void>;
  createClientAndProject: (params: {
    clientName: string;
    industry: string;
    contactName: string;
    contactEmail: string;
    retainerMonthlyUsd: number;
    projectName: string;
    projectCode: string;
  }) => Promise<void>;
  inviteTeamMember: (params: {
    name: string;
    email: string;
    role: Role;
    title: string;
  }) => Promise<void>;
  createOrganization: (params: {
    name: string;
    domain: string;
    planTier: "starter" | "growth" | "enterprise";
  }) => Promise<void>;
  sendApprovalReminder: (deliverableId: string) => Promise<void>;
  toggleAiActionItem: (
    deliverableId: string,
    commentId: string,
    taskId: string
  ) => Promise<void>;
  updateWorkflowStages: (stages: WorkflowStage[]) => Promise<void>;
  updateBillingPlan: (
    planTier: "starter" | "growth" | "enterprise"
  ) => Promise<void>;
  scheduleSocialPublish: (params: {
    deliverableId: string;
    platform: "instagram" | "linkedin" | "tiktok";
    handle: string;
    caption: string;
    hashtags: string[];
    scheduledFor: string;
  }) => Promise<void>;
}

const initialSnapshot = createInitialAgencySnapshot();

export const useAgencyStore = create<AgencyStore>((set, get) => ({
  ...initialSnapshot,
  hasEnteredDashboard: false,
  activeTab: "inbox",
  selectedDeliverableId: "del_lumina_hero",
  statusFilter: "all",
  clientFilter: "all",
  searchQuery: "",
  isAuthenticated: true,
  authProviderLabel: "Google Cloud Identity (Firebase Auth)",
  isSyncing: false,
  lastFallbackUsed: true,
  toasts: [],

  enterDashboard: () => set({ hasEnteredDashboard: true }),
  returnToDemoGate: () => set({ hasEnteredDashboard: false }),
  resetDemoData: async () => {
    set({ isSyncing: true });
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESET_DEMO_DATA" }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        set({
          ...json.data,
          selectedDeliverableId: "del_lumina_hero",
          statusFilter: "all",
          clientFilter: "all",
          searchQuery: "",
          isSyncing: false,
        });
        get().pushToast(
          "Prototype Demo State Reset",
          "All deliverables, receipts, and Pub/Sub queues restored to pristine initial state.",
          "success"
        );
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedDeliverableId: (id) => set({ selectedDeliverableId: id }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setClientFilter: (clientFilter) => set({ clientFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  pushToast: (title, description, variant = "default") => {
    const id = `tst_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    set((state) => ({
      toasts: [{ id, title, description, variant }, ...state.toasts].slice(0, 4),
    }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 5000);
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  loginWithGoogle: async (presetMember) => {
    set({ isSyncing: true });
    try {
      const res = await signInWithGoogleIdentity(
        presetMember
          ? { name: presetMember.name, email: presetMember.email }
          : undefined
      );
      const matched =
        presetMember ||
        get().teamMembers.find(
          (m) => m.email.toLowerCase() === res.email.toLowerCase()
        ) ||
        get().currentUser;

      set({
        isAuthenticated: true,
        currentUser: matched,
        activeOrgId: matched.orgId,
        authProviderLabel:
          res.provider === "firebase_google_oauth"
            ? "Firebase Google OAuth (Live)"
            : "Google Workspace Identity (Resilient SSO)",
        isSyncing: false,
      });
      get().pushToast(
        `Signed in as ${matched.name}`,
        `Role: ${matched.role.toUpperCase()} • Tenant: ${matched.orgId}`,
        "success"
      );
    } catch {
      set({ isSyncing: false });
    }
  },

  logout: async () => {
    await signOutGoogleIdentity();
    set({ isAuthenticated: false });
    get().pushToast(
      "Signed out of AgencyOS",
      "Your session token has been cleared.",
      "default"
    );
  },

  switchOrganization: (orgId) => {
    const state = get();
    const org = state.organizations.find((o) => o.id === orgId);
    const orgMembers = state.teamMembers.filter((m) => m.orgId === orgId);
    const orgDeliverables = state.deliverables.filter((d) => d.orgId === orgId);

    set({
      activeOrgId: orgId,
      currentUser: orgMembers[0] || state.currentUser,
      selectedDeliverableId: orgDeliverables[0]?.id || "",
      clientFilter: "all",
      statusFilter: "all",
    });

    get().pushToast(
      `Switched Tenant: ${org?.name || orgId}`,
      `Strict Firestore tenant isolation enforced for ${org?.domain}`,
      "default"
    );
  },

  switchUserRole: (memberId) => {
    const member = get().teamMembers.find((m) => m.id === memberId);
    if (!member) return;
    set({
      currentUser: member,
      activeOrgId: member.orgId,
    });
    get().pushToast(
      `Active Role: ${member.role.toUpperCase()}`,
      `Viewing AgencyOS as ${member.name} (${member.title})`,
      "default"
    );
  },

  hydrateFromServer: async () => {
    set({ isSyncing: true });
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error("Server state fetch failed");
      const json = await res.json();
      if (json.success && json.data) {
        const currentOrgId = get().activeOrgId;
        set({
          ...json.data,
          activeOrgId: currentOrgId || json.data.activeOrgId,
          isSyncing: false,
          lastFallbackUsed: Boolean(json.meta?.fallbackUsed),
        });
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  submitApprovalDecision: async (params) => {
    set({ isSyncing: true });
    const user = get().currentUser;
    try {
      const res = await fetch(`/api/portal/${params.deliverableId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: params.decision,
          reviewerName: params.reviewerName || user.name,
          reviewerEmail: params.reviewerEmail || user.email,
          reviewerRole: params.reviewerRole || user.role,
          comment: params.comment,
          pinX: params.pinX,
          pinY: params.pinY,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.snapshot) {
        const activeOrgId = get().activeOrgId;
        set({
          ...json.data.snapshot,
          activeOrgId,
          isSyncing: false,
        });
        const receipt = json.data.receipt;
        get().pushToast(
          params.decision === "approved"
            ? `Receipt ${receipt.id} Issued`
            : `Revision Requested (${json.data.aiActionCount || 0} AI Tasks)`,
          params.decision === "approved"
            ? `Signed SHA-256 receipt locked to v${receipt.versionNumber}.0`
            : `Client feedback converted to actionable checklist items & queued in Pub/Sub.`,
          params.decision === "approved" ? "success" : "warning"
        );
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  uploadNewVersion: async (params) => {
    set({ isSyncing: true });
    const user = get().currentUser;
    try {
      const res = await fetch("/api/deliverables/version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...params,
          dimensions: "2400 x 3000 px",
          uploadedBy: user.name,
          uploaderEmail: user.email,
          uploaderRole: user.role,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.snapshot) {
        const activeOrgId = get().activeOrgId;
        set({
          ...json.data.snapshot,
          activeOrgId,
          isSyncing: false,
        });
        const invalidated = json.data.invalidatedPreviousApproval;
        get().pushToast(
          invalidated
            ? `v${json.data.newVersion.versionNumber}.0 Uploaded — Re-Approval Required`
            : `Version v${json.data.newVersion.versionNumber}.0 Uploaded`,
          invalidated
            ? `Approved file was modified. Previous approval receipt superseded; client re-approval required.`
            : `SHA-256 checksum computed and client notification queued in GCP Pub/Sub.`,
          invalidated ? "warning" : "success"
        );
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  createDeliverable: async (params) => {
    set({ isSyncing: true });
    const state = get();
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_DELIVERABLE",
          orgId: state.activeOrgId,
          ...params,
          actorName: state.currentUser.name,
          actorEmail: state.currentUser.email,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const newDel = json.data.deliverables[0];
        set({
          ...json.data,
          activeOrgId: state.activeOrgId,
          selectedDeliverableId: newDel?.id || state.selectedDeliverableId,
          isSyncing: false,
        });
        get().pushToast(
          "Deliverable Created & Queued",
          `Secure client review link generated (${newDel?.shareToken}).`,
          "success"
        );
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  createClientAndProject: async (params) => {
    set({ isSyncing: true });
    const state = get();
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_CLIENT_AND_PROJECT",
          orgId: state.activeOrgId,
          ...params,
          actorName: state.currentUser.name,
          actorEmail: state.currentUser.email,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        set({
          ...json.data,
          activeOrgId: state.activeOrgId,
          isSyncing: false,
        });
        get().pushToast(
          `Client "${params.clientName}" Onboarded`,
          `Project "${params.projectName}" (${params.projectCode}) initialized.`,
          "success"
        );
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  inviteTeamMember: async (params) => {
    set({ isSyncing: true });
    const state = get();
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "INVITE_TEAM_MEMBER",
          orgId: state.activeOrgId,
          ...params,
          actorName: state.currentUser.name,
          actorEmail: state.currentUser.email,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        set({
          ...json.data,
          activeOrgId: state.activeOrgId,
          isSyncing: false,
        });
        get().pushToast(
          `Invited ${params.name} (${params.role.toUpperCase()})`,
          `Invitation dispatched via GCP Pub/Sub email queue to ${params.email}.`,
          "success"
        );
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  createOrganization: async (params) => {
    set({ isSyncing: true });
    const state = get();
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_ORGANIZATION",
          ...params,
          ownerName: state.currentUser.name,
          ownerEmail: state.currentUser.email,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        set({
          ...json.data,
          isSyncing: false,
        });
        get().pushToast(
          `Organization "${params.name}" Created`,
          `Isolated Firestore tenant initialized on ${params.planTier.toUpperCase()} plan.`,
          "success"
        );
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  sendApprovalReminder: async (deliverableId) => {
    set({ isSyncing: true });
    const state = get();
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_APPROVAL_REMINDER",
          deliverableId,
          actorName: state.currentUser.name,
          actorEmail: state.currentUser.email,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        set({
          ...json.data,
          activeOrgId: state.activeOrgId,
          isSyncing: false,
        });
        get().pushToast(
          "Approval Reminder Queued in Pub/Sub",
          "Email notification & magic portal link dispatched to client stakeholder.",
          "success"
        );
      } else {
        set({ isSyncing: false });
      }
    } catch {
      set({ isSyncing: false });
    }
  },

  toggleAiActionItem: async (deliverableId, commentId, taskId) => {
    const state = get();
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_AI_TASK",
          deliverableId,
          commentId,
          taskId,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        set({
          ...json.data,
          activeOrgId: state.activeOrgId,
        });
      }
    } catch {
      // Ignore transient toggle error
    }
  },

  updateWorkflowStages: async (stages) => {
    const state = get();
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_WORKFLOW_STAGES",
          stages,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        set({
          ...json.data,
          activeOrgId: state.activeOrgId,
        });
        get().pushToast(
          "Approval Pipeline Updated",
          "Workflow stages and SLA rules saved.",
          "success"
        );
      }
    } catch {
      // Ignore
    }
  },

  updateBillingPlan: async (planTier) => {
    const state = get();
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_BILLING_PLAN",
          orgId: state.activeOrgId,
          planTier,
          actorName: state.currentUser.name,
          actorEmail: state.currentUser.email,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        set({
          ...json.data,
          activeOrgId: state.activeOrgId,
        });
        get().pushToast(
          `Subscription Upgraded to ${planTier.toUpperCase()}`,
          "Usage quotas and seat limits expanded immediately.",
          "success"
        );
      }
    } catch {
      // Ignore
    }
  },

  scheduleSocialPublish: async (params) => {
    const state = get();
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SCHEDULE_SOCIAL_PUBLISH",
          ...params,
          actorName: state.currentUser.name,
          actorEmail: state.currentUser.email,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        set({
          ...json.data,
          activeOrgId: state.activeOrgId,
        });
        get().pushToast(
          `Scheduled to ${params.platform.toUpperCase()}`,
          `Approved asset queued in topic 'agencyos-social-publishing' for ${params.handle}.`,
          "success"
        );
      }
    } catch {
      // Ignore
    }
  },
}));
