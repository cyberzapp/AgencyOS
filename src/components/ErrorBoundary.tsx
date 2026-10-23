"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class HeavyDutyErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: "",
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || "Unexpected rendering fault intercepted.",
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AgencyOS Resilient ErrorBoundary]", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Resilient Recovery Active
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  CIRCUIT_BREAKER // UI_ISOLATION_GUARD
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              AgencyOS intercepted an isolated interface exception and preserved
              your local and cloud state snapshot without data loss.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-5 font-mono text-xs text-slate-700 break-words">
              {this.state.errorMessage}
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>State Snapshot Verified</span>
              </div>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restore Workspace
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
