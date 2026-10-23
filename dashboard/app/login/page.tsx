/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

"use client";

import React, { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Bot, MessagesSquare, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "Alpha";

const ERROR_COPY: Record<string, string> = {
  OAuthSignin: "Could not reach Discord. Check the app credentials and try again.",
  OAuthCallback: "Discord rejected the login. Try again in a moment.",
  AccessDenied: "Access was denied on Discord's side.",
  Configuration: "Login is not configured yet — add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET.",
};

function LoginCard() {
  const params = useSearchParams();
  const router = useRouter();
  const { status, data: session } = useSession();
  const errorKey = params.get("error");
  const requested = params.get("callbackUrl") || "/dashboard";
  const callbackUrl = requested.startsWith("/") ? requested : "/dashboard";
  const errorMsg = errorKey
    ? (ERROR_COPY[errorKey] ?? "Something went wrong signing you in.")
    : null;

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken && !session?.error) {
      router.replace(callbackUrl);
    }
  }, [status, session?.accessToken, session?.error, callbackUrl, router]);

  if (status === "authenticated" && session?.accessToken && !session?.error) {
    return (
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0a0a0b] p-10 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
        Opening your dashboard…
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 rounded-3xl bg-white flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.15)] mb-6">
          <Bot className="h-8 w-8 text-black" />
        </div>
        <h1 className="text-4xl font-bold text-white font-outfit tracking-tight mb-3">Welcome back</h1>
        <p className="text-slate-500 font-medium">
          Sign in with Discord to manage your servers.
        </p>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[#0a0a0b] p-8 md:p-10 shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
        {errorMsg && (
          <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-white/[0.04] p-4 mb-6">
            <TriangleAlert className="h-5 w-5 text-white shrink-0 mt-0.5" />
            <p className="text-sm text-slate-200 font-medium">{errorMsg}</p>
          </div>
        )}

        <Button
          onClick={() => signIn("discord", { callbackUrl })}
          className="btn-shine w-full rounded-full py-7 bg-white hover:bg-slate-200 text-black font-bold text-base transition-all gap-3"
        >
          <MessagesSquare className="h-5 w-5" />
          Continue with Discord
        </Button>

        <div className="flex items-center gap-4 my-7">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">SSO</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="h-4 w-4 text-slate-400" />
          Secured by Discord OAuth2 · no password needed
        </div>
      </div>

      <p className="text-center text-sm text-slate-600 font-medium mt-8">
        New here?{" "}
        <Link href="/" className="text-white font-bold hover:underline">
          See what {BRAND} does
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans flex items-center justify-center px-5 py-16 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="silk-layer absolute inset-0" />
      </div>
      <div className="relative z-10 w-full flex justify-center">
        <Suspense
          fallback={
            <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0a0a0b] p-10 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">
              Loading…
            </div>
          }
        >
          <LoginCard />
        </Suspense>
      </div>
    </div>
  );
}
