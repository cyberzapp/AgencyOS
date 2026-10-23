"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ClientPortalPreviewView } from "@/components/ClientPortalPreviewView";
import { useAgencyStore } from "@/store/useAgencyStore";

export default function StandaloneClientPortalPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || "tok_lumina_serum_2026";
  const hydrateFromServer = useAgencyStore((s) => s.hydrateFromServer);

  useEffect(() => {
    hydrateFromServer();
  }, [hydrateFromServer]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to AgencyOS Workspace</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero-Login Verified Client Portal Session</span>
        </div>
      </div>

      <ClientPortalPreviewView standaloneToken={token} />
    </div>
  );
}
