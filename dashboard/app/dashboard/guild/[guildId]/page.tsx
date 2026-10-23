/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart4,
  BookOpen,
  CheckCircle2,
  Command,
  FileText,
  Hash,
  Image as ImageIcon,
  Link2,
  Mail,
  Mic,
  Shield,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserCircle2,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { api } from "@/lib/api";
import { BotStatus, ServerProfileConfig } from "@/types/api";

export const revalidate = 0;

const MODULES = [
  { title: "Auto Moderation", desc: "Anti-spam, invites, links and mass mentions.", icon: ShieldCheck, href: "automod" },
  { title: "Ticket System", desc: "Support panels, categories and transcripts.", icon: Ticket, href: "tickets" },
  { title: "Leveling", desc: "XP, ranks and a server leaderboard.", icon: BarChart4, href: "leveling" },
  { title: "Event Logging", desc: "Audit trails for every important event.", icon: FileText, href: "logging" },
  { title: "Welcome", desc: "Greet new members with embeds and DMs.", icon: Sparkles, href: "welcome" },
  { title: "Verification", desc: "Gate access behind a verification step.", icon: Shield, href: "verification" },
  { title: "Auto Role", desc: "Hand out roles to humans and bots.", icon: Users, href: "autorole" },
  { title: "Join to Create", desc: "Temporary voice channels on demand.", icon: Mic, href: "j2c" },
  { title: "Invite Tracking", desc: "Know who invited every new member.", icon: Link2, href: "invites" },
  { title: "Join DM", desc: "Send a private message when members join.", icon: Mail, href: "joindm" },
  { title: "Reaction Roles", desc: "Self-assignable roles from reactions.", icon: CheckCircle2, href: "reactionroles" },
  { title: "Auto React", desc: "Automatic emoji reactions on messages.", icon: Zap, href: "autoreact" },
];

function formatUptime(latency: number | undefined) {
  if (latency === undefined || Number.isNaN(latency)) return "—";
  return `${Math.round(latency * 1000)} ms`;
}

export default async function GuildOverviewPage({ params }: { params: { guildId: string } }) {
  const [profileResult, prefixResult, statusResult] = await Promise.allSettled([
    api.getServerProfile(params.guildId),
    api.getPrefix(params.guildId),
    api.getBotStatus(),
  ]);

  const profile: ServerProfileConfig | null =
    profileResult.status === "fulfilled" ? profileResult.value : null;
  const prefix = prefixResult.status === "fulfilled" ? prefixResult.value.prefix : ">";
  const status: BotStatus | null = statusResult.status === "fulfilled" ? statusResult.value : null;

  const displayName = profile?.display_name || profile?.bot_name || "Alpha";
  const avatar = profile?.avatar || profile?.bot_avatar;
  const banner = profile?.banner;
  const accent = profile?.accent_color || "#5865F2";

  return (
    <div className="space-y-8">
      {/* Identity + live status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-2 overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-xl shadow-black/20">
          <div className="relative h-32 w-full bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent sm:h-36">
            {banner ? (
              <img src={banner} alt="Server profile banner" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-700">
                <ImageIcon className="h-4 w-4" /> No per-server banner
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
          </div>

          <div className="relative -mt-10 px-6 pb-6 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div
                className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-[#0a0a0a] bg-white/10 shadow-2xl"
                style={{ boxShadow: `0 0 0 2px ${accent}` }}
              >
                {avatar ? (
                  <img src={avatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-slate-500">
                    {displayName.charAt(0)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-black tracking-tight text-white">{displayName}</h2>
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
                    style={{ backgroundColor: accent }}
                  >
                    App
                  </span>
                  {profile?.display_name && (
                    <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Server only
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                  {profile?.bio || "No custom bio for this server yet."}
                </p>
              </div>

              <Link
                href={`/dashboard/guild/${params.guildId}/serverprofile`}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/10 sm:self-auto"
              >
                <UserCircle2 className="h-4 w-4" /> Edit profile
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Prefix", value: prefix, icon: Command },
                { label: "Latency", value: formatUptime(status?.latency), icon: Wifi },
                { label: "Servers", value: status ? status.guild_count.toLocaleString() : "—", icon: Hash },
                { label: "Users", value: status ? status.user_count.toLocaleString() : "—", icon: Users },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3"
                >
                  <div className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <item.icon className="h-3 w-3" /> {item.label}
                  </div>
                  <p className="truncate font-mono text-lg font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Profile health */}
        <section className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0a0a0a] p-6">
          <div>
            <div className="mb-6 flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-500">Profile health</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
                <span className="text-xs font-bold text-slate-300">Discord sync</span>
                {profile?.synced ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Synced
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Needs attention</span>
                )}
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
                <span className="text-xs font-bold text-slate-300">Nickname permission</span>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    profile?.can_manage ? "text-emerald-300" : "text-amber-300"
                  }`}
                >
                  {profile?.can_manage ? "Granted" : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-3">
                <span className="text-xs font-bold text-slate-300">Last update</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : "Never"}
                </span>
              </div>
            </div>
          </div>

          {profile?.sync_error && (
            <p className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3 text-[11px] leading-relaxed text-amber-200">
              {profile.sync_error}
            </p>
          )}

          <Link
            href={`/dashboard/guild/${params.guildId}/settings`}
            className="mt-5 inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-white/10"
          >
            <span className="inline-flex items-center gap-2">
              <Command className="h-4 w-4 text-slate-400" /> Change command prefix
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
          </Link>
        </section>
      </div>

      {/* Modules */}
      <section>
        <div className="mb-5 flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight text-white">Modules</h2>
          <div className="h-px flex-1 bg-white/10" />
          <Link
            href={`/dashboard/guild/${params.guildId}/settings`}
            className="text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors hover:text-white"
          >
            Server settings
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((mod) => (
            <Link
              key={mod.title}
              href={`/dashboard/guild/${params.guildId}/${mod.href}`}
              className="group rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 transition-all hover:-translate-y-0.5 hover:border-white/25"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-primary transition-transform group-hover:scale-110">
                  <mod.icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-700 transition-colors group-hover:text-white" />
              </div>
              <h3 className="mb-1 font-bold text-white">{mod.title}</h3>
              <p className="text-xs leading-relaxed text-slate-500">{mod.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
            <BookOpen className="h-4 w-4" /> Quick actions
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { label: "Profile page", href: "serverprofile", icon: UserCircle2 },
              { label: "Leaderboard", href: "leveling/leaderboard", icon: BarChart4 },
              { label: "Logging filters", href: "logging", icon: FileText },
              { label: "Verification", href: "verification", icon: ShieldCheck },
            ].map((action) => (
              <Link
                key={action.label}
                href={`/dashboard/guild/${params.guildId}/${action.href}`}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] px-4 py-3 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <action.icon className="h-4 w-4 text-slate-500" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6">
          <h2 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
            <Wifi className="h-4 w-4" /> Bot status
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Account</span>
              <span className="font-bold text-white">{status?.user || "Unknown"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Shards</span>
              <span className="font-mono text-slate-300">{status?.shards ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">API latency</span>
              <span className="font-mono text-slate-300">{formatUptime(status?.latency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Guild ID</span>
              <span className="max-w-[55%] truncate font-mono text-[11px] text-slate-500">{params.guildId}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
