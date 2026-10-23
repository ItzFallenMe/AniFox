/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Search as SearchIcon,
  ShieldCheck,
  Zap,
  BookOpen,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Rocket,
  Lock,
  Ticket,
  BarChart4,
  Mic,
  ScanEye,
  SlidersHorizontal,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Scroll reveal ── */
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("reveal", visible && "reveal-visible", className)}
    >
      {children}
    </div>
  );
}

type DocTopic = {
  name: string;
  description: string;
  intro: string;
  steps: string[];
  commands: string[];
  note: string;
};

const DOCS: { title: string; icon: React.ElementType; items: DocTopic[] }[] = [
  {
    title: "Getting Started",
    icon: Rocket,
    items: [
      {
        name: "Introduction",
        description: "What the Alpha Engine is.",
        intro:
          "The Alpha Engine is a full-stack Discord automation platform: a discord.py bot for real-time protection and engagement, plus a Next.js dashboard for visual configuration. One invite, one login, every module.",
        steps: [
          "Invite the bot with Administrator permission so protection modules can act.",
          "Run >help to confirm the prefix, or open the dashboard to change it.",
          "Enable modules one by one — Antinuke first, then Automod, then engagement.",
        ],
        commands: [">help", ">antinuke enable"],
        note: "Keep the bot's role at the top of the role hierarchy, or bans and timeouts will silently fail.",
      },
      {
        name: "Quick Start",
        description: "Protected in 30 seconds.",
        intro:
          "Three commands take a fresh server from zero to guarded. Everything else can be tuned later from the dashboard.",
        steps: [
          "Send the antinuke enable command to arm raid protection instantly.",
          "Create an automod log channel so violations have a paper trail.",
          "Turn on verification so unverified accounts never reach chat.",
        ],
        commands: [">antinuke enable", ">automod logging #mod-logs", ">verify setup"],
        note: "Test with an alt account before announcing new protections to your members.",
      },
      {
        name: "Architecture",
        description: "How events flow.",
        intro:
          "Every Discord event hits the gateway, is routed to the matching cog, and — when the dashboard is linked — mirrors state through the FastAPI backend over an encrypted tunnel.",
        steps: [
          "Gateway events arrive on a sharded connection with full intents.",
          "Cogs process in priority order: antinuke, automod, trackers, engagement.",
          "State changes sync to the dashboard API for live panels and logs.",
        ],
        commands: ["$ alpha initialize --mode enterprise"],
        note: "The dashboard is a view layer only — protection keeps running even if the API is offline.",
      },
    ],
  },
  {
    title: "Security Modules",
    icon: ShieldCheck,
    items: [
      {
        name: "Anti-Nuke",
        description: "Absolute lockdown protocols.",
        intro:
          "Anti-Nuke watches for ban floods, kick floods, channel and role mass-deletes, webhook spam, and rogue bot adds — and bans the offender within seconds.",
        steps: [
          "Whitelist your trusted staff so their bulk actions are never punished.",
          "Enable the module and pick ban as the fixed punishment.",
          "Simulate with a test account: mass-delete two channels and watch it fire.",
        ],
        commands: [">antinuke enable", ">whitelist add @staff", ">antinuke config"],
        note: "The bot must outrank every moderated role, or Discord will reject its bans.",
      },
      {
        name: "Verification",
        description: "Captcha and challenge gates.",
        intro:
          "Verification parks newcomers in an unverified state until they complete a challenge — captcha, button press, or account-age check — keeping raid bots out of chat.",
        steps: [
          "Point verification at your rules channel and a log channel.",
          "Choose the challenge strength: button for chill servers, captcha for targets.",
          "Set the unverified role with zero send permissions everywhere.",
        ],
        commands: [">verify setup #rules", ">verify level captcha"],
        note: "Exempt existing members first, or a re-verify wave will annoy veterans.",
      },
      {
        name: "Automod",
        description: "Context-aware filtering.",
        intro:
          "Automod scores every message against spam, caps, links, invites, mass mentions, and emoji floods — deleting, warning, or muting based on your thresholds.",
        steps: [
          "Start with spam + invites at default thresholds and watch the log channel.",
          "Tighten caps and emoji-spam limits only after a week of baseline data.",
          "Add whitelist entries for announcement bots and staff.",
        ],
        commands: [">automod spam on", ">automod invites strict", ">automod whitelist add #media"],
        note: "One strict rule with logging beats five silent rules nobody tunes.",
      },
    ],
  },
  {
    title: "Management",
    icon: SlidersHorizontal,
    items: [
      {
        name: "Join to Create",
        description: "Dynamic voice channels.",
        intro:
          "Join-to-create spawns a temporary voice channel every time someone joins the lobby, then deletes it when it empties. No more dead permanent channels.",
        steps: [
          "Create a lobby voice channel named ➕ Join to Create.",
          "Register it so the bot claims ownership of spawns.",
          "Set user limits and bitrate defaults per template.",
        ],
        commands: [">j2c setup", ">j2c lobby #join-to-create"],
        note: "Give the bot Move Members permission or it cannot herd users into spawns.",
      },
      {
        name: "Leveling",
        description: "Cinematic rank generation.",
        intro:
          "Leveling awards XP per message, renders 4K rank cards on level-up, and stacks role rewards as members climb. Leaderboards sync to the dashboard.",
        steps: [
          "Enable XP gain and pick a rate that matches your chat speed.",
          "Add role rewards at milestone levels to make grinding visible.",
          "Blacklist spam channels so farm bots gain nothing.",
        ],
        commands: [">leveling enable", ">leveling reward add 10 @grinder", ">rank"],
        note: "Halve XP rates before events, or giveaway hype will inflate your economy.",
      },
      {
        name: "Tickets",
        description: "Enterprise helpdesk.",
        intro:
          "Tickets give every support request a private channel with transcripts, claim buttons, and auto-close timers — support at lightspeed.",
        steps: [
          "Create the ticket panel in your support channel.",
          "Assign responder roles so claims route to the right humans.",
          "Turn on transcripts so resolved tickets stay searchable.",
        ],
        commands: [">ticket setup #support", ">ticket transcripts on"],
        note: "Cap open tickets per user at 1–3, or one member can flood your staff.",
      },
    ],
  },
];

const ALL_TOPICS = DOCS.flatMap((s) => s.items.map((t) => ({ ...t, section: s.title })));

export default function DocsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Introduction");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const active =
    ALL_TOPICS.find((t) => t.name === activeTab) ?? ALL_TOPICS[0];
  const activeIndex = ALL_TOPICS.findIndex((t) => t.name === active.name);
  const prev = ALL_TOPICS[(activeIndex - 1 + ALL_TOPICS.length) % ALL_TOPICS.length];
  const next = ALL_TOPICS[(activeIndex + 1) % ALL_TOPICS.length];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_TOPICS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.section.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  const copyCmd = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopied(cmd);
      setTimeout(() => setCopied((c) => (c === cmd ? null : c)), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  const go = (name: string) => {
    setActiveTab(name);
    setIsSidebarOpen(false);
    setQuery("");
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans overflow-x-hidden">
      {/* Aurora background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      </div>

      {/* Nav */}
      <nav className="fixed top-4 inset-x-0 z-50 px-4">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_10px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.09)]">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-white to-slate-500 flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Bot className="h-5 w-5 text-black" />
              </div>
              <span className="text-base font-bold text-white font-outfit tracking-tight hidden sm:block">
                Alpha <span className="text-white">Docs</span>
              </span>
            </Link>
            <div className="hidden lg:block relative">
              <SearchIcon className="absolute left-4 h-4 w-4 text-slate-500 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="text"
                placeholder="Search documentation..."
                className="w-72 bg-white/[0.03] border border-white/[0.07] rounded-full py-2.5 pl-11 pr-4 text-xs font-bold text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-white/40 focus:border-white/30 transition-all"
              />
              {results.length > 0 && (
                <div className="absolute top-12 left-0 w-80 rounded-2xl border border-white/[0.07] bg-[#0a0a0a]/95 backdrop-blur-2xl p-2 shadow-2xl shadow-black/60 z-50">
                  {results.map((r) => (
                    <button
                      key={r.name}
                      onClick={() => go(r.name)}
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/10 transition-colors group"
                    >
                      <p className="text-sm font-bold text-white group-hover:text-white transition-colors">{r.name}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {r.section} · {r.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2.5 rounded-xl text-slate-400 hover:bg-white/5"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-label="Toggle docs menu"
            >
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/">
              <Button variant="ghost" className="rounded-full text-slate-400 hover:text-white gap-2 text-[11px] font-black uppercase tracking-widest">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Exit Docs</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto flex pt-28 relative z-10">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-80 bg-black/95 backdrop-blur-2xl border-r border-white/[0.06] pt-28 transition-transform duration-500 lg:translate-x-0 lg:static lg:bg-transparent lg:backdrop-blur-none lg:border-none lg:pt-0 lg:pr-6",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full lg:sticky lg:top-28 p-6 lg:p-0 overflow-y-auto no-scrollbar lg:max-h-[calc(100vh-8rem)]">
            {DOCS.map((section) => (
              <div key={section.title} className="mb-8">
                <h4 className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 mb-4 px-3">
                  <section.icon className="h-3.5 w-3.5 text-white/70" />
                  {section.title}
                </h4>
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => go(item.name)}
                      className={cn(
                        "w-full flex flex-col items-start gap-1 p-4 rounded-2xl transition-all text-left border",
                        activeTab === item.name
                          ? "bg-white/[0.08] border-white/25 shadow-[0_0_24px_rgba(255,255,255,0.08)]"
                          : "hover:bg-white/[0.025] border-transparent"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-bold transition-colors",
                          activeTab === item.name ? "text-white" : "text-slate-300"
                        )}
                      >
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{item.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 px-5 pb-24 lg:pl-10 min-w-0">
          <Reveal key={active.name}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.25em] mb-7">
              <BookOpen className="h-3 w-3" />
              {active.section} · Guide
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white font-outfit tracking-tighter uppercase mb-6 leading-[0.95]">
              {active.name}
              <span className="text-shimmer bg-gradient-to-r from-white via-slate-300 to-white bg-clip-text text-transparent">
                .
              </span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed mb-12 max-w-3xl font-medium">{active.intro}</p>

            {/* Steps */}
            <div className="space-y-4 mb-12">
              {active.steps.map((step, i) => (
                <div
                  key={i}
                  className="group flex items-start gap-5 p-6 rounded-3xl border border-white/[0.05] bg-white/[0.012] hover:border-white/25 hover:bg-white/[0.025] transition-all duration-500"
                >
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center text-sm font-black text-white group-hover:scale-110 transition-transform">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <p className="text-slate-300 font-medium leading-relaxed pt-2">{step}</p>
                </div>
              ))}
            </div>

            {/* Commands */}
            <div className="rounded-[2rem] border border-white/[0.06] bg-black/30 p-7 md:p-8 mb-12 overflow-hidden relative">
              <div className="absolute -top-16 right-0 w-64 h-40 bg-white/[0.07] blur-[80px] rounded-full pointer-events-none" />
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 mb-5">Copy-paste commands</p>
              <div className="space-y-3">
                {active.commands.map((cmd) => (
                  <div
                    key={cmd}
                    className="group flex items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.06] hover:border-white/30 rounded-2xl px-5 py-3.5 transition-colors"
                  >
                    <code className="font-mono text-sm text-white truncate">{cmd}</code>
                    <button
                      onClick={() => copyCmd(cmd)}
                      className="shrink-0 h-9 w-9 rounded-xl bg-white/[0.04] hover:bg-white/15 border border-white/[0.06] hover:border-white/30 flex items-center justify-center transition-all"
                      aria-label={`Copy ${cmd}`}
                    >
                      {copied === cmd ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div className="flex items-start gap-4 p-6 rounded-3xl bg-white/[0.04] border border-white/20 mb-16">
              <Zap className="h-5 w-5 text-white shrink-0 mt-0.5" />
              <p className="text-sm text-white/80 font-medium leading-relaxed">
                <span className="font-black uppercase tracking-widest text-white text-[11px] block mb-1">Pro tip</span>
                {active.note}
              </p>
            </div>

            {/* Prev / Next */}
            <div className="grid sm:grid-cols-2 gap-4 pt-10 border-t border-white/[0.06]">
              <button
                onClick={() => go(prev.name)}
                className="group flex items-center gap-4 p-5 rounded-3xl border border-white/[0.06] hover:border-white/30 hover:bg-white/[0.03] transition-all text-left"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600 group-hover:text-white group-hover:-translate-x-1 transition-all shrink-0" />
                <span>
                  <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Previous</span>
                  <span className="block text-white font-bold">{prev.name}</span>
                </span>
              </button>
              <button
                onClick={() => go(next.name)}
                className="group flex items-center justify-end gap-4 p-5 rounded-3xl border border-white/[0.06] hover:border-white/30 hover:bg-white/[0.03] transition-all text-right"
              >
                <span>
                  <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Next</span>
                  <span className="block text-white font-bold">{next.name}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            </div>

            <div className="mt-12 flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.35em]">DOC-ID: {active.name.slice(0, 2).toUpperCase()}_{active.name.length}749</p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white dot-live" />
                <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Live</span>
              </div>
            </div>
          </Reveal>
        </main>
      </div>
    </div>
  );
}
