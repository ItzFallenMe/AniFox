/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-white" />
      </div>
      
      <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Something went wrong</h2>
      <p className="text-slate-400 max-w-md mb-8">
        This page could not load. The bot API may be offline or a request timed out — try again in a moment.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
        <Button 
          onClick={() => reset()}
          className="flex-1 gap-2 h-12 font-bold"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Link href="/dashboard" className="flex-1">
          <Button 
            variant="outline"
            className="w-full gap-2 h-12 font-bold border-white/10"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-8 p-4 bg-black/40 border border-white/10 rounded-xl text-left text-xs text-white overflow-auto max-w-full font-mono">
          {error.message}
        </pre>
      )}
    </div>
  );
}
