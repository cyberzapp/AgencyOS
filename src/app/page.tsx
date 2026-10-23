"use client";

import React, { useEffect } from "react";
import { DemoPrototypeLandingGate } from "@/components/DemoPrototypeLandingGate";
import { SidebarAndHeader } from "@/components/SidebarAndHeader";
import { ContentInboxView } from "@/components/ContentInboxView";
import { ClientPortalPreviewView } from "@/components/ClientPortalPreviewView";
import { VersionReceiptsView } from "@/components/VersionReceiptsView";
import { BottleneckReportView } from "@/components/BottleneckReportView";
import { WorkflowAndQueueView } from "@/components/WorkflowAndQueueView";
import { SocialAndInvoicingView } from "@/components/SocialAndInvoicingView";
import { AiCopilotStudioView } from "@/components/AiCopilotStudioView";
import { OrgBillingAndMvpView } from "@/components/OrgBillingAndMvpView";
import { useAgencyStore } from "@/store/useAgencyStore";

export default function AgencyOSWorkspacePage() {
  const hasEnteredDashboard = useAgencyStore((s) => s.hasEnteredDashboard);
  const activeTab = useAgencyStore((s) => s.activeTab);
  const hydrateFromServer = useAgencyStore((s) => s.hydrateFromServer);

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

  if (!hasEnteredDashboard) {
    return <DemoPrototypeLandingGate />;
  }

  return (
    <SidebarAndHeader>
      {activeTab === "inbox" && <ContentInboxView />}
      {activeTab === "portal_preview" && <ClientPortalPreviewView />}
      {activeTab === "versions_receipts" && <VersionReceiptsView />}
      {activeTab === "bottlenecks" && <BottleneckReportView />}
      {activeTab === "workflow_builder" && <WorkflowAndQueueView />}
      {activeTab === "social_invoicing" && <SocialAndInvoicingView />}
      {activeTab === "ai_copilot" && <AiCopilotStudioView />}
      {activeTab === "org_billing_mvp" && <OrgBillingAndMvpView />}
    </SidebarAndHeader>
  );
}
