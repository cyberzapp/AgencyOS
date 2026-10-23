export type Role = "owner" | "manager" | "designer" | "client";

export type DeliverableStatus =
  | "draft"
  | "internal_review"
  | "client_review"
  | "changes_requested"
  | "approved"
  | "published";

export type AssetType =
  | "image"
  | "video"
  | "carousel"
  | "pdf_deck"
  | "copy_doc";

export interface AIActionItem {
  id: string;
  task: string;
  category: "typography" | "color" | "layout" | "copy" | "compliance";
  priority: "high" | "medium" | "low";
  completed: boolean;
}

export interface AnnotationComment {
  id: string;
  deliverableId: string;
  versionId: string;
  versionNumber: number;
  authorName: string;
  authorEmail: string;
  authorRole: Role;
  content: string;
  createdAt: string;
  pinX?: number; // 0-100 percentage across asset canvas
  pinY?: number; // 0-100 percentage down asset canvas
  resolved: boolean;
  aiActionItems: AIActionItem[];
}

export interface ApprovalReceipt {
  id: string; // e.g., RCPT-2026-8841F
  deliverableId: string;
  deliverableTitle: string;
  versionId: string;
  versionNumber: number;
  fileSha256: string;
  decision: "approved" | "changes_requested" | "rejected";
  reviewerName: string;
  reviewerEmail: string;
  reviewerRole: Role;
  comment: string;
  signatureHash: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  supersededByVersion: number | null;
}

export interface AssetVersion {
  id: string;
  versionNumber: number;
  label: string;
  fileUrl: string;
  fileName: string;
  fileSizeMb: number;
  dimensions: string;
  fileSha256: string;
  uploadedBy: string;
  uploadedAt: string;
  changeSummary: string;
  status:
    | "superseded"
    | "pending_review"
    | "approved"
    | "changes_requested"
    | "rejected";
  receiptId: string | null;
}

export interface SocialScheduleConfig {
  platform: "instagram" | "linkedin" | "tiktok";
  handle: string;
  caption: string;
  hashtags: string[];
  scheduledFor: string;
  status: "draft" | "queued_in_pubsub" | "published";
  externalPostId?: string;
}

export interface Deliverable {
  id: string;
  orgId: string;
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
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
  assetType: AssetType;
  status: DeliverableStatus;
  priority: "urgent" | "high" | "medium" | "low";
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  deadline: string;
  currentVersion: number;
  requiresReapproval: boolean;
  previousApprovedVersion: number | null;
  shareToken: string;
  shareLinkActive: boolean;
  shareLinkExpiresAt: string;
  sharePin?: string;
  turnaroundHours: number;
  revisionCount: number;
  versions: AssetVersion[];
  comments: AnnotationComment[];
  receipts: ApprovalReceipt[];
  workflowStageId: string;
  socialSchedule?: SocialScheduleConfig;
  invoiceMilestoneUsd?: number;
  updatedAt: string;
}

export interface Client {
  id: string;
  orgId: string;
  name: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactTitle: string;
  logoInitials: string;
  accentColor: string;
  avgResponseTimeHours: number;
  totalApproved: number;
  pendingApprovalsCount: number;
  revisionRateAvg: number;
  retainerMonthlyUsd: number;
  portalAccessPin?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  orgId: string;
  clientId: string;
  clientName: string;
  name: string;
  code: string;
  status: "active" | "completed" | "on_hold";
  dueDate: string;
  deliverableCount: number;
}

export interface TeamMember {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  status: "active" | "invited";
  avatarInitials: string;
  joinedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain: string;
  planTier: "starter" | "growth" | "enterprise";
  billingStatus: "active" | "trialing" | "past_due";
  monthlyPriceUsd: number;
  nextBillingDate: string;
  usage: {
    storageUsedMb: number;
    storageLimitMb: number;
    activeDeliverables: number;
    deliverablesLimit: number;
    teamSeatsUsed: number;
    teamSeatsLimit: number;
    aiCreditsUsed: number;
    aiCreditsLimit: number;
  };
  reminderConfig: {
    enabled: boolean;
    autoRemindAfterHours: number;
    escalateOverdueHours: number;
    sendClientReceiptCopy: boolean;
    channels: ("email" | "pubsub_webhook" | "google_chat")[];
  };
  ssoConfig: {
    enabled: boolean;
    provider: "google_workspace_oidc" | "cloud_identity_saml";
    enforcedDomain: string;
    requireMfa: boolean;
    sessionTimeoutMinutes: number;
  };
}

export interface AuditEvent {
  id: string;
  orgId: string;
  actorName: string;
  actorEmail: string;
  actorRole: Role;
  action: string;
  targetType:
    | "deliverable"
    | "version"
    | "approval_receipt"
    | "portal_link"
    | "organization"
    | "billing"
    | "pubsub_queue"
    | "social_publish"
    | "workflow";
  targetId: string;
  targetTitle: string;
  metadata: Record<string, string | number | boolean>;
  timestamp: string;
  severity: "info" | "success" | "warning" | "critical";
}

export interface PubSubJob {
  id: string;
  orgId: string;
  topic:
    | "agencyos-approval-events"
    | "agencyos-email-notifications"
    | "agencyos-social-publishing"
    | "agencyos-ai-triage";
  eventType: string;
  recipient?: string;
  subject?: string;
  payload: Record<string, unknown>;
  status:
    | "published"
    | "processing"
    | "acknowledged"
    | "dead_letter_fallback";
  attempts: number;
  provider: "gcp_pubsub" | "local_resilient_queue";
  messageId: string;
  createdAt: string;
  processedAt: string;
}

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  roleRequired: Role;
  slaHours: number;
  autoNotifyClient: boolean;
  requireSha256Receipt: boolean;
  aiGuardrailCheck: boolean;
  order: number;
}

export interface AgencyInvoice {
  id: string;
  orgId: string;
  clientId: string;
  clientName: string;
  invoiceNumber: string;
  description: string;
  amountUsd: number;
  status: "paid" | "pending_approval_release" | "sent" | "overdue";
  linkedDeliverableId: string;
  linkedDeliverableTitle: string;
  linkedReceiptId: string | null;
  dueDate: string;
  issuedAt: string;
}

export interface ErrorLogEntry {
  id: string;
  code: string;
  service:
    | "firebase_auth"
    | "firestore_db"
    | "gcp_pubsub"
    | "gcp_storage"
    | "gemini_ai"
    | "api_gateway";
  message: string;
  fallbackAction: string;
  resolvedByFallback: boolean;
  timestamp: string;
}

export interface AgencyStateSnapshot {
  organizations: Organization[];
  activeOrgId: string;
  currentUser: TeamMember;
  teamMembers: TeamMember[];
  clients: Client[];
  projects: Project[];
  deliverables: Deliverable[];
  auditEvents: AuditEvent[];
  pubsubJobs: PubSubJob[];
  workflowStages: WorkflowStage[];
  invoices: AgencyInvoice[];
  errorLogs: ErrorLogEntry[];
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
    recoverable: boolean;
  };
  meta: {
    requestId: string;
    timestamp: string;
    latencyMs: number;
    provider: "firebase_gcp_cloud" | "resilient_local_engine";
    fallbackUsed: boolean;
  };
}
