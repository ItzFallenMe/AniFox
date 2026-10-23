/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ExternalLink,
  Github,
  LifeBuoy,
  Plus,
  Server as ServerIcon,
  ShieldAlert,
  Terminal,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import { DOCS_URL, GITHUB_URL, INVITE_URL, SUPPORT_URL } from "@/lib/links";

export const revalidate = 0;

export default async function DashboardPage() {
  let botInfo;
  let error: string | null = null;

  try {
    botInfo = await api.getBotInfo();
  } catch (err: any) {
    console.error("Failed to fetch bot info:", err);
    error = err.message || "Failed to connect to the bot API.";
    botInfo = {
      name: "Alpha Bot",
      guilds: 0,
      users: 0,
      commands: 0,
      latency: "0ms",
    };
  }

  const stats = [
    { name: "Servers", value: botInfo.guilds.toLocaleString(), icon: ServerIcon },
    { name: "Members", value: botInfo.users.toLocaleString(), icon: Users },
    { name: "Commands", value: botInfo.commands.toLocaleString(), icon: Terminal },
    { name: "API Latency", value: botInfo.latency, icon: Activity },
  ];

  const quickActions = [
    {
      title: "Manage Servers",
      desc: "Open a server and change its modules.",
      icon: ServerIcon,
      href: "/dashboard/guilds",
      external: false,
    },
    {
      title: "Documentation",
      desc: "Setup guides and command reference.",
      icon: BookOpen,
      href: DOCS_URL,
      external: true,
    },
    {
      title: "Support Server",
      desc: "Ask the team for help with your setup.",
      icon: LifeBuoy,
      href: SUPPORT_URL,
      external: true,
    },
    {
      title: "Invite the Bot",
      desc: "Add the bot to another Discord server.",
      icon: Plus,
      href: INVITE_URL,
      external: true,
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col justify-between gap-6 px-2 md:flex-row md:items-end">
        <div>
          <h1 className="font-outfit text-4xl font-bold tracking-tight text-white md:text-5xl">
            Your bot, <span className="italic text-white">at a glance.</span>
          </h1>
          <p className="mt-3 flex items-center gap-2 font-medium text-slate-400">
            Live status for
            <span className="rounded-lg border border-white/20 bg-white/10 px-2 py-0.5 font-bold text-white">
              {botInfo.name}
            </span>
          </p>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-red-200">
            <ShieldAlert className="h-4 w-4" />
            <span>API unavailable</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            <span>API connected</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.03] p-7 shadow-2xl transition-all duration-500 hover:border-white/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {stat.name}
                </p>
                <p className="font-outfit text-3xl font-bold tracking-tight text-white">{stat.value}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 transition-all duration-500 group-hover:scale-110 group-hover:bg-white/20">
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Quick actions */}
        <div className="relative overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.03] p-10 shadow-2xl lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-outfit text-2xl font-bold tracking-tight text-white">Quick Actions</h2>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
              Shortcuts
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {quickActions.map((item) => {
              const content = (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-colors group-hover/item:bg-white/10">
                    <item.icon className="h-5 w-5 text-white/60 transition-colors group-hover/item:text-white" />
                  </div>
                  <div>
                    <h4 className="flex items-center gap-1.5 text-sm font-bold text-white">
                      {item.title}
                      {item.external && <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />}
                    </h4>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      {item.desc}
                    </p>
                  </div>
                </>
              );

              return item.external ? (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group/item flex items-center gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                >
                  {content}
                </a>
              ) : (
                <Link
                  key={item.title}
                  href={item.href}
                  className="group/item flex items-center gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/20 hover:bg-white/[0.05]"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bot status */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[40px] border border-white/5 bg-white/[0.03] p-10 shadow-2xl">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Bot className="h-5 w-5 text-white" />
              <h2 className="font-outfit text-2xl font-bold text-white">Bot Status</h2>
            </div>
            <p className="mb-8 text-sm font-medium text-slate-500">
              Connection details from the bot API.
            </p>

            <div className="space-y-3">
              {[
                { name: "Discord API", value: error ? "Offline" : "Connected" },
                { name: "Latency", value: botInfo.latency },
                { name: "Loaded commands", value: botInfo.commands.toLocaleString() },
                { name: "Cached servers", value: botInfo.guilds.toLocaleString() },
              ].map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4"
                >
                  <span className="text-xs font-bold text-slate-300">{service.name}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">
                    {service.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/dashboard/guilds"
            className="relative z-10 mt-8 flex w-full items-center justify-center gap-2 rounded-[20px] border border-white/20 bg-white/10 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-white/20"
          >
            Open servers <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Community links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Support Server", href: SUPPORT_URL, icon: LifeBuoy },
          { label: "Documentation", href: DOCS_URL, icon: BookOpen },
          { label: "Website", href: process.env.NEXT_PUBLIC_WEBSITE_URL || GITHUB_URL, icon: ExternalLink },
          { label: "GitHub", href: GITHUB_URL, icon: Github },
        ].map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0a0a0a] px-5 py-4 text-xs font-bold text-slate-300 transition-colors hover:border-white/25 hover:text-white"
          >
            <span className="inline-flex items-center gap-2.5">
              <link.icon className="h-4 w-4 text-slate-500" />
              {link.label}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-600" />
          </a>
        ))}
      </div>
    </div>
  );
}
