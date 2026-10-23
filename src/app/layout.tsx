import type { Metadata } from "next";
import "./globals.css";
import { HeavyDutyErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "AgencyOS — Client Approval, Version Audit & Delivery Platform",
  description:
    "AI-powered client approval and delivery platform for small content agencies. Makes client feedback actionable, traceable, and hard to lose.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF9F6] text-slate-900">
        <HeavyDutyErrorBoundary>{children}</HeavyDutyErrorBoundary>
      </body>
    </html>
  );
}
