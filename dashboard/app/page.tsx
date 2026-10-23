/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import {
  ShieldCheck,
  Zap,
  BarChart4,
  MessageSquare,
  ChevronRight,
  LayoutDashboard,
  LogIn,
  Layers,
  Sparkles,
  Bot,
  Activity,
  History,
  CheckCircle2,
  ShieldAlert,
  Globe,
  Users2,
  Lock,
  Gamepad2,
  Music4,
  User,
  Plus,
  ArrowUpRight,
  ArrowUp,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GITHUB_URL, INVITE_URL } from "@/lib/links";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "Alpha";


/* ── Scroll reveal wrapper ─────────────────────────────── */
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
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
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

/* ── Animated counter ──────────────────────────────────── */
function Counter({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const dur = 1700;
          const tick = (t: number) => {
            const p = Math.min(1, (t - t0) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(to * eased);
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  const text =
    decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("en-US");
  return (
    <span ref={ref}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}

/* ── Mouse spotlight card ──────────────────────────────── */
function Spotlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      }}
      className={cn("spotlight", className)}
    >
      {children}
    </div>
  );
}

/* ── 3D tilt wrapper ───────────────────────────────────── */
function Tilt({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="tilt-stage">
      <div
        ref={ref}
        onMouseMove={(e) => {
          const el = ref.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = `rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
        }}
        onMouseLeave={() => {
          if (ref.current) ref.current.style.transform = "rotateX(0deg) rotateY(0deg)";
        }}
        className={cn("tilt-inner", className)}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Live event log feed ───────────────────────────────── */
const LOG_LINES = [
  { tag: "ANTINUKE", msg: "raid signature blocked · 14 bots removed", hot: true },
  { tag: "LEVEL", msg: "@nova hit level 42 · rank card rendered", hot: false },
  { tag: "TICKET", msg: "#support-118 opened by @mira", hot: false },
  { tag: "AUTOMOD", msg: "spam wave muted in #general", hot: true },
  { tag: "VOICE", msg: "lounge-3 auto-created for @kai", hot: false },
  { tag: "GIVEAWAY", msg: "Nitro Basic ended · 312 entries rolled", hot: false },
  { tag: "VERIFY", msg: "@juno passed captcha in 6s", hot: false },
  { tag: "BACKUP", msg: "guild config snapshot encrypted", hot: false },
];

function LiveLogs() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 2300);
    return () => clearInterval(id);
  }, []);
  const shown = [4, 3, 2, 1, 0].map((k) => {
    const idx = (((tick - k) % LOG_LINES.length) + LOG_LINES.length) % LOG_LINES.length;
    return LOG_LINES[idx];
  });
  return (
    <div className="space-y-2.5">
      {shown.map((line, i) => (
        <div
          key={`${tick}-${i}`}
          className="log-line flex items-center gap-3 text-[11px] font-mono"
          style={{ opacity: 1 - i * 0.18 }}
        >
          <span
            className={cn(
              "px-2 py-0.5 rounded-md font-black text-[9px] tracking-widest shrink-0",
              line.hot ? "bg-white/15 text-white" : "bg-white/[0.04] text-slate-400"
            )}
          >
            {line.tag}
          </span>
          <span className="text-slate-400 truncate">{line.msg}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Data ──────────────────────────────────────────────── */
const TICKER = [
  "Antinuke", "Automod", "Leveling", "Tickets", "Music", "Giveaways",
  "Logging", "Reaction Roles", "Verification", "Welcome", "AI Chat", "Backups",
];

const FEATURES = [
  {
    title: "Antinuke",
    desc: "Ban floods, channel wipes and rogue bots get stopped and banned in seconds.",
    icon: ShieldCheck,
  },
  {
    title: "Prefix + Slash Commands",
    desc: "Every command works with your custom prefix and as a slash command.",
    icon: Zap,
  },
  {
    title: "Leveling",
    desc: "XP per message, 4K rank cards and role rewards your members grind for.",
    icon: BarChart4,
  },
  {
    title: "Tickets",
    desc: "Private support channels with transcripts, claims and auto-close.",
    icon: MessageSquare,
  },
  {
    title: "Live Logs",
    desc: "Every mod action, join and warning lands in your log channel instantly.",
    icon: History,
  },
  {
    title: "Backups",
    desc: "Your whole server setup saved and restorable whenever you need it.",
    icon: Layers,
  },
];

const MODULES = [
  { name: "Anti-Nuke", desc: "Absolute server lockdown.", icon: ShieldAlert },
  { name: "Verification", desc: "Bot-free onboarding.", icon: CheckCircle2 },
  { name: "Welcome", desc: "Cinematic entries.", icon: Sparkles },
  { name: "Vanity Roles", desc: "Custom server identity.", icon: Gamepad2 },
  { name: "Auto Role", desc: "Instant rank assignment.", icon: User },
  { name: "Join to Create", desc: "Self-service voice channels.", icon: Music4 },
  { name: "Tracking", desc: "Predictive user metrics.", icon: Activity },
  { name: "Invites", desc: "Advanced growth tracking.", icon: Globe },
  { name: "Custom Roles", desc: "User-defined permissions.", icon: Lock },
  { name: "Reaction Roles", desc: "Interactive role menus.", icon: Layers },
  { name: "Tickets", desc: "Support at lightspeed.", icon: MessageSquare },
  { name: "Join DM", desc: "Personalized welcomes.", icon: Users2 },
];

const FAQS = [
  {
    q: `Is the ${BRAND} Engine free to use?`,
    a: "Yes — the engine is 100% free for every community, with all core modules included.",
  },
  {
    q: "How secure is my server data?",
    a: "Configuration data is stored on the bot's host and used only to run the features you enable. We never sell or share it, and you can remove it at any time.",
  },
  {
    q: "Can I migrate from other bots?",
    a: "Yes. Switch your prefix-level commands over gradually — most servers run both bots side by side for a week, then drop the old one once mods prefer the dashboard.",
  },
  {
    q: "Do I need to host or code anything?",
    a: "No. Invite the bot, run a couple of setup commands or click through the dashboard — hosting, updates and uptime are all handled for you.",
  },
];

const SHOWCASE: { tab: string; commands: { cmd: string; desc: string }[] }[] = [
  {
    tab: "Security",
    commands: [
      { cmd: ">antinuke enable", desc: "Arm raid protection instantly" },
      { cmd: ">whitelist add @staff", desc: "Trust your team" },
      { cmd: ">automod spam on", desc: "Kill spam floods" },
      { cmd: ">verify setup #rules", desc: "Gate new members" },
    ],
  },
  {
    tab: "Management",
    commands: [
      { cmd: ">ticket setup #support", desc: "Launch the helpdesk" },
      { cmd: ">j2c setup", desc: "Dynamic voice channels" },
      { cmd: ">leveling reward add 10 @role", desc: "Reward grinders" },
      { cmd: ">reactionroles create", desc: "Self-serve roles" },
    ],
  },
  {
    tab: "Fun",
    commands: [
      { cmd: ">rank", desc: "Show your rank card" },
      { cmd: ">giveaway start 1h 1 Nitro", desc: "Hype in one line" },
      { cmd: ">play lofi beats", desc: "Music in seconds" },
      { cmd: ">birthday set 04-25", desc: "Never miss a cake" },
    ],
  },
];

/* ── Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const openDashboard = () => {
    if (status === "unauthenticated") {
      signIn("discord", { callbackUrl: "/dashboard" });
      return;
    }
    // Signed in (or the session is still loading): let the dashboard decide.
    router.push("/dashboard");
  };

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const [showcaseTab, setShowcaseTab] = useState(0);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? h.scrollTop / max : 0);
      setShowTop(h.scrollTop > 900);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copyCmd = async (cmd: string) => {
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedCmd(cmd);
      setTimeout(() => setCopiedCmd((c) => (c === cmd ? null : c)), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 selection:bg-white/30 font-sans overflow-x-hidden">
      {/* Scroll progress */}
      <div
        className="fixed top-0 left-0 h-[3px] z-[60] bg-gradient-to-r from-white via-white to-slate-300 shadow-[0_0_12px_rgba(255,255,255,0.6)]"
        style={{ width: `${(progress * 100).toFixed(2)}%` }}
      />
      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className={cn(
          "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(255,255,255,0.4)] flex items-center justify-center transition-all duration-500 hover:scale-110 hover:bg-slate-200 active:scale-95",
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}
      >
        <ArrowUp className="h-5 w-5 text-black" />
      </button>
      {/* Aurora background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="silk-layer absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
      </div>

      {/* Floating pill nav */}
      <nav className="fixed top-4 inset-x-0 z-50 px-4">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_10px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.09)]">
          <div className="flex items-center gap-3 group cursor-pointer pl-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-white to-slate-500 flex items-center justify-center shadow-lg shadow-white/25 border border-white/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Bot className="h-5 w-5 text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white font-outfit leading-none">{BRAND}</span>
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/80 mt-0.5">Dashboard</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#architecture" className="hover:text-white transition-colors">Setup</Link>
            <Link href="#modules" className="hover:text-white transition-colors">Modules</Link>
            <Link href="#network" className="hover:text-white transition-colors">Servers</Link>
          </div>

          <Button
            onClick={openDashboard}
            className="btn-shine rounded-full px-6 h-10 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-white/25 bg-gradient-to-r from-white to-slate-400 text-black border-none hover:scale-[1.04] active:scale-95 transition-transform"
          >
            <LogIn className="h-3.5 w-3.5" />
            Open Dashboard
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <header className="relative z-10 pt-48 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.06] border border-white/15 text-white text-[10px] font-black uppercase tracking-[0.3em] mb-10 backdrop-blur-md">
              <span className="dot-live h-2 w-2 rounded-full bg-white" />
              Online now · Guarding 5,200+ servers
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="text-6xl sm:text-8xl md:text-[9rem] font-bold text-white tracking-tighter leading-[0.85] mb-8 font-outfit uppercase">
              Run your
              <br />
              <span className="text-shimmer bg-gradient-to-r from-white via-slate-300 to-white bg-clip-text text-transparent italic font-black">
                Discord Empire.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-14 font-medium">
              One invite adds antinuke, automod, leveling, tickets, giveaways and
              music to your server. Set it up in 30 seconds — no code, no hosting.
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Button
                onClick={openDashboard}
                className="btn-shine w-full sm:w-auto rounded-2xl px-12 py-8 text-lg font-black uppercase gap-3 group shadow-[0_0_60px_rgba(255,255,255,0.25)] bg-white text-black hover:bg-slate-200 border-none transition-all hover:scale-[1.04] active:scale-95"
              >
                <LayoutDashboard className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                Open Dashboard
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto rounded-2xl px-12 py-8 text-lg font-bold border-white/10 bg-white/[0.02] backdrop-blur-3xl hover:bg-white/[0.06] hover:border-white/20 gap-2 text-white transition-all group"
              >
                <a href={INVITE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  Add to Server
                  <ChevronRight className="h-5 w-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </a>
              </Button>
            </div>
          </Reveal>

          {/* Live counters */}
          <Reveal delay={480}>
            <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-6 mt-20">
              {[
                { value: <Counter to={5200} suffix="+" />, label: "Servers" },
                { value: <Counter to={12} suffix="M+" />, label: "Members Safe" },
                { value: <Counter to={99.99} decimals={2} suffix="%" />, label: "Uptime" },
                { value: <Counter to={12} suffix="ms" />, label: "Median Ping" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-4xl md:text-5xl font-black text-white font-outfit tabular-nums">{s.value}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80 mt-2">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Ticker */}
        <Reveal delay={200} className="max-w-7xl mx-auto mt-24">
          <div className="relative overflow-hidden rounded-full border border-white/[0.05] bg-white/[0.01] backdrop-blur-xl py-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            <div className="marquee-track flex w-max items-center gap-10 pr-10">
              {[...TICKER, ...TICKER].map((t, i) => (
                <span key={i} className="flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 whitespace-nowrap">
                  {t}
                  <Sparkles className="h-3.5 w-3.5 text-white/60" />
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Live console mockup — Alpha command center */}
        <div className="max-w-6xl mx-auto mt-24">
          <Reveal delay={150}>
            <Tilt>
              <div className="relative rounded-[2rem] border border-white/10 bg-black overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.9)]">
                <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                {/* window bar */}
                <div className="h-14 border-b border-white/[0.07] flex items-center justify-between px-5 bg-white/[0.015]">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-white/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/[0.07]" />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/15 text-[9px] font-black text-white tracking-[0.25em] uppercase">
                    <span className="dot-live h-1.5 w-1.5 rounded-full bg-white" />
                    Live · {BRAND} Dashboard
                  </div>
                  <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span className="dot-live h-1.5 w-1.5 rounded-full bg-white" />
                    12ms
                  </div>
                </div>
                <div className="grid md:grid-cols-[230px_1fr] text-left">
                  {/* sidebar */}
                  <div className="hidden md:flex flex-col border-r border-white/[0.07] bg-white/[0.008] p-4 gap-1">
                    {[
                      { n: "Overview", icon: LayoutDashboard, on: false },
                      { n: "Security", icon: ShieldCheck, on: true },
                      { n: "Leveling", icon: BarChart4, on: false },
                      { n: "Tickets", icon: MessageSquare, on: false },
                      { n: "Music", icon: Music4, on: false },
                    ].map((item) => (
                      <div
                        key={item.n}
                        className={cn(
                          "relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest",
                          item.on ? "bg-white/[0.07] text-white" : "text-slate-600"
                        )}
                      >
                        {item.on && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-white" />}
                        <item.icon className="h-4 w-4" />
                        {item.n}
                      </div>
                    ))}
                    <div className="mt-auto rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-600 mb-1.5">Shard 07</p>
                      <p className="flex items-center gap-2 text-[11px] font-bold text-white">
                        <span className="dot-live h-1.5 w-1.5 rounded-full bg-white" />
                        Operational
                      </p>
                    </div>
                  </div>
                  {/* main */}
                  <div className="p-5 md:p-6 space-y-4">
                    {/* KPI row */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Threats blocked", value: <Counter to={1284} />, sub: "+12 / hr" },
                        { label: "Members safe", value: <Counter to={48210} />, sub: "across 5.2K servers" },
                        { label: "Median response", value: <Counter to={12} suffix="ms" />, sub: "edge network" },
                      ].map((kpi) => (
                        <div key={kpi.label} className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4 md:p-5">
                          <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-600 mb-2 truncate">{kpi.label}</p>
                          <p className="text-2xl md:text-3xl font-black text-white font-outfit tabular-nums">{kpi.value}</p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1 truncate">{kpi.sub}</p>
                        </div>
                      ))}
                    </div>
                    {/* activity chart */}
                    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-600">Blocked attempts · 24h</p>
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white">
                          <span className="dot-live h-1.5 w-1.5 rounded-full bg-white" />
                          Live
                        </span>
                      </div>
                      <svg viewBox="0 0 300 80" className="w-full h-20" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
                            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,65 L25,60 L50,62 L75,48 L100,52 L125,38 L150,42 L175,28 L200,33 L225,20 L250,26 L275,12 L300,16 L300,80 L0,80 Z"
                          fill="url(#sparkFill)"
                        />
                        <path
                          d="M0,65 L25,60 L50,62 L75,48 L100,52 L125,38 L150,42 L175,28 L200,33 L225,20 L250,26 L275,12 L300,16"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="spark-draw"
                        />
                      </svg>
                    </div>
                    {/* stream + modules */}
                    <div className="grid md:grid-cols-[1fr_210px] gap-4">
                      <div className="rounded-2xl border border-white/[0.07] bg-black p-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-600 mb-4">Event stream</p>
                        <LiveLogs />
                      </div>
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.01] p-4 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-600 px-2 pt-1 pb-2">Modules</p>
                        {[
                          { n: "Antinuke", s: "Armed" },
                          { n: "Automod", s: "Watching" },
                          { n: "Leveling", s: "On" },
                          { n: "Tickets", s: "3 open" },
                        ].map((m) => (
                          <div key={m.n} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                            <span className="text-[11px] font-bold text-slate-300">{m.n}</span>
                            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              {m.s}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* status bar */}
                <div className="border-t border-white/[0.07] px-5 py-3 flex items-center justify-between font-mono text-[10px] text-slate-600 bg-white/[0.008]">
                  <span>shard_07 · connected</span>
                  <span className="flex items-center gap-2">
                    <span className="dot-live h-1.5 w-1.5 rounded-full bg-white" />
                    synced just now
                  </span>
                </div>
              </div>
            </Tilt>
          </Reveal>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="py-36 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-10">
              <div className="max-w-3xl">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white mb-6">— What you get</p>
                <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter font-outfit uppercase leading-[0.95]">
                  One bot. <br />
                  <span className="text-shimmer bg-gradient-to-r from-white via-slate-300 to-white bg-clip-text text-transparent italic">
                    Every tool.
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-8 pb-2">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] mb-2">Ping Latency</p>
                  <p className="text-5xl font-black text-white font-outfit tabular-nums">
                    <Counter to={12} suffix="ms" />
                  </p>
                </div>
                <div className="h-14 w-[1px] bg-white/10" />
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] mb-2">Global Uptime</p>
                  <p className="text-5xl font-black text-white font-outfit tabular-nums">
                    <Counter to={99.99} decimals={2} suffix="%" />
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <Reveal key={feature.title} delay={(i % 3) * 120}>
                <Spotlight className="group h-full glass rounded-[2rem] p-10 hover:border-white/25 transition-colors duration-500 overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.06] scale-50 group-hover:scale-110 transition-all duration-700">
                    <feature.icon className="h-52 w-52 text-white" />
                  </div>
                  <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-8 bg-white/10 border border-white/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-black/40 relative">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 tracking-tight font-outfit relative">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium relative group-hover:text-slate-400 transition-colors">{feature.desc}</p>
                  <div className="mt-6 h-[2px] w-0 bg-gradient-to-r from-white to-slate-300 group-hover:w-full transition-all duration-700" />
                </Spotlight>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="py-36 px-6 bg-white/[0.008] border-y border-white/[0.04] relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <Reveal>
              <div className="inline-flex px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                30-second setup
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tighter font-outfit uppercase leading-[0.95] mb-6">
                Live in <br />
                <span className="text-slate-500 italic">3 steps.</span>
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed font-medium mb-10">
                No hosting, no code, no config files. If you can invite a bot, you can run {BRAND}.
              </p>
            </Reveal>
            <div className="space-y-4">
              {[
                { n: "01", title: "Invite the bot", desc: "One click, Administrator ticked so protection modules can actually act." },
                { n: "02", title: "Switch modules on", desc: "Antinuke first, then automod and leveling — each takes one command." },
                { n: "03", title: "Manage from the dashboard", desc: "Tweak every setting visually. Changes apply to your server instantly." },
              ].map((item, i) => (
                <Reveal key={item.n} delay={i * 100}>
                  <div className="group flex items-start gap-5 p-5 rounded-3xl border border-white/[0.05] hover:bg-white/[0.02] hover:border-white/15 transition-all">
                    <span className="text-2xl font-black text-white/20 group-hover:text-white font-outfit transition-colors">{item.n}</span>
                    <div>
                      <h4 className="text-base font-bold text-white font-outfit tracking-tight">{item.title}</h4>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">{item.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal delay={150}>
            <div className="relative aspect-square flex items-center justify-center group">
              <div className="absolute inset-0 bg-white/[0.07] blur-[110px] rounded-full" />
              <div className="orbit-a absolute h-[88%] w-[88%] rounded-full border border-dashed border-white/20" />
              <div className="orbit-b absolute h-[64%] w-[64%] rounded-full border border-white/[0.07]">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.7)]" />
              </div>
              <div className="orbit-c absolute h-[42%] w-[42%] rounded-full border border-white/[0.05]">
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 h-2 w-2 rounded-full bg-slate-300 shadow-[0_0_16px_rgba(255,255,255,0.7)]" />
              </div>
              <div className="relative h-36 w-36 rounded-[2rem] bg-gradient-to-br from-white/20 to-transparent border border-white/30 backdrop-blur-xl flex items-center justify-center shadow-[0_0_70px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform duration-700">
                <Bot className="h-16 w-16 text-white" />
                <span className="dot-live absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white border-4 border-black" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-36 px-6">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-20 space-y-5">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white">— Every tool your mods need</p>
              <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter font-outfit uppercase leading-[0.95]">
                One bot. <br />
                <span className="text-shimmer bg-gradient-to-r from-white via-slate-300 to-white bg-clip-text text-transparent italic">
                  Zero clutter.
                </span>
              </h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Replace five single-purpose bots with one dashboard your whole staff understands.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {MODULES.map((mod, i) => (
              <Reveal key={mod.name} delay={(i % 4) * 90}>
                <div className="group h-full p-7 rounded-[1.75rem] bg-white/[0.015] border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/25 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(255,255,255,0.12)] transition-all duration-500">
                  <div className="float-y rounded-2xl bg-white/[0.03] flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors p-3.5 w-fit" style={{ animationDelay: `${(i % 4) * 0.6}s` }}>
                    <mod.icon className="h-6 w-6 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <h4 className="text-lg font-bold text-white font-outfit mb-1.5 tracking-tight">{mod.name}</h4>
                  <p className="text-[11px] text-slate-600 font-bold uppercase tracking-widest">{mod.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Command showcase */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-12 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white">— Try it</p>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tighter font-outfit uppercase leading-[0.95]">
                Type it. <span className="text-shimmer bg-gradient-to-r from-white via-slate-300 to-white bg-clip-text text-transparent italic">Done.</span>
              </h2>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.012] backdrop-blur-xl p-6 md:p-10 overflow-hidden relative">
              <div className="absolute -top-20 right-10 w-72 h-44 bg-white/[0.08] blur-[90px] rounded-full pointer-events-none" />
              <div className="flex flex-wrap gap-2.5 mb-8 relative">
                {SHOWCASE.map((cat, i) => (
                  <button
                    key={cat.tab}
                    onClick={() => setShowcaseTab(i)}
                    className={cn(
                      "px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] border transition-all duration-400",
                      showcaseTab === i
                        ? "bg-white/15 border-white/40 text-white shadow-[0_0_24px_rgba(255,255,255,0.15)]"
                        : "border-white/[0.07] bg-white/[0.02] text-slate-500 hover:text-slate-200 hover:border-white/20"
                    )}
                  >
                    {cat.tab}
                  </button>
                ))}
              </div>
              <div key={showcaseTab} className="grid sm:grid-cols-2 gap-4 relative">
                {SHOWCASE[showcaseTab].commands.map((c, i) => (
                  <div
                    key={c.cmd}
                    className="log-line group flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-black/30 hover:border-white/30 px-5 py-4 transition-colors"
                    style={{ animationDelay: `${i * 90}ms` }}
                  >
                    <div className="min-w-0">
                      <code className="block font-mono text-sm text-white truncate">{c.cmd}</code>
                      <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">{c.desc}</p>
                    </div>
                    <button
                      onClick={() => copyCmd(c.cmd)}
                      aria-label={`Copy ${c.cmd}`}
                      className="shrink-0 h-9 w-9 rounded-xl bg-white/[0.04] hover:bg-white/15 border border-white/[0.06] hover:border-white/30 flex items-center justify-center transition-all"
                    >
                      {copiedCmd === c.cmd ? (
                        <Check className="h-4 w-4 text-white" />
                      ) : (
                        <Copy className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Network */}
      <section id="network" className="py-36 px-6 bg-white/[0.015] relative overflow-hidden border-y border-white/[0.04]">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1">
              <Reveal>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white mb-6">— Trusted daily</p>
                <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter font-outfit uppercase leading-[0.95] mb-6">
                  Servers <br />
                  <span className="text-white">run on it.</span>
                </h2>
                <p className="text-xl text-slate-500 leading-relaxed font-medium mb-12">
                  From 20-member friend groups to 100,000-member communities — mods start their day in this dashboard.
                </p>
              </Reveal>
              <div className="space-y-7">
                {[
                  { to: 5200, suffix: "+", decimals: 0, label: "Servers Protected" },
                  { to: 38, suffix: "M+", decimals: 0, label: "Commands Run" },
                  { to: 12, suffix: "M+", decimals: 0, label: "Members Safe" },
                ].map((item, i) => (
                  <Reveal key={item.label} delay={i * 120}>
                    <div className="flex items-center gap-6 group">
                      <div className="text-5xl font-black text-white font-outfit tabular-nums group-hover:text-white transition-colors">
                        <Counter to={item.to} suffix={item.suffix} decimals={item.decimals} />
                      </div>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-white/30 to-transparent" />
                      <div className="text-[10px] font-black uppercase text-white tracking-[0.3em]">{item.label}</div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
            <Reveal delay={150} className="flex-1 w-full">
              <div className="relative aspect-square max-w-[480px] mx-auto rounded-[3rem] bg-black border border-white/[0.06] overflow-hidden flex items-center justify-center shadow-[0_30px_90px_rgba(0,0,0,0.6)]">
                <div className="bg-grid-animated absolute inset-0 opacity-70" />
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="ping-ring absolute h-56 w-56 rounded-full border-2 border-white/40"
                    style={{ animationDelay: `${i * 1.05}s` }}
                  />
                ))}
                <Globe className="h-40 w-40 text-white/20 relative" />
                <div className="absolute flex flex-col items-center gap-3">
                  <div className="h-20 w-20 text-white bg-black rounded-3xl p-4 border border-white/50 shadow-[0_0_50px_rgba(255,255,255,0.5)] float-y flex items-center justify-center">
                    <Bot className="h-10 w-10" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white bg-black/60 px-3 py-1 rounded-full border border-white/30">You are here</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-36 px-6">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white mb-5">— FAQ</p>
              <h2 className="text-4xl md:text-6xl font-black text-white font-outfit tracking-tighter uppercase">Knowledge Base</h2>
            </div>
          </Reveal>
          <div className="space-y-4">
            {FAQS.map((item, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={i} delay={i * 80}>
                  <div
                    className={cn(
                      "rounded-[1.75rem] border transition-all duration-500 overflow-hidden cursor-pointer",
                      open
                        ? "border-white/25 bg-white/[0.03] shadow-[0_10px_50px_rgba(255,255,255,0.08)]"
                        : "border-white/[0.05] bg-white/[0.01] hover:border-white/15"
                    )}
                    onClick={() => setOpenFaq(open ? null : i)}
                  >
                    <div className={cn(open && "faq-open")}>
                      <div className="flex items-center justify-between gap-6 p-7 md:p-8">
                        <h4 className="text-lg font-bold text-white font-outfit uppercase tracking-tight">{item.q}</h4>
                        <div className="faq-icon h-9 w-9 shrink-0 rounded-full bg-white/10 border border-white/25 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="faq-answer">
                        <div>
                          <p className="px-7 md:px-8 pb-7 md:pb-8 text-slate-400 font-medium leading-relaxed">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="conic-border relative rounded-[3rem] p-16 md:p-24 overflow-hidden bg-gradient-to-br from-white/[0.07] via-white/[0.02] to-transparent text-center shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-10">
                  <span className="dot-live h-1.5 w-1.5 rounded-full bg-white" />
                  Setup takes less than 30 seconds
                </div>
                <h2 className="text-6xl md:text-[7rem] font-bold text-white tracking-tighter font-outfit mb-8 uppercase leading-[0.85] italic">
                  Add it <br />
                  <span className="text-shimmer bg-gradient-to-r from-white via-slate-300 to-white bg-clip-text text-transparent not-italic font-black">
                    tonight.
                  </span>
                </h2>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-14 font-medium">
                  Join 5,000+ servers already protected. Your mods will thank you tomorrow.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                  <Button
                    onClick={openDashboard}
                    className="btn-shine w-full sm:w-auto rounded-2xl px-14 py-8 bg-white text-black hover:bg-slate-100 border-none shadow-[0_20px_50px_rgba(0,0,0,0.4)] font-black text-lg uppercase transition-transform hover:scale-105 active:scale-95 gap-2"
                  >
                    Get Started Free
                    <ArrowUpRight className="h-5 w-5" />
                  </Button>
                  <div className="flex items-center gap-3 text-white/70 text-xs font-black uppercase tracking-[0.25em]">
                    <div className="h-2.5 w-2.5 rounded-full bg-white dot-live" />
                    Bot online right now
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-24 pb-10 border-t border-white/[0.05] bg-black relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center">
                  <Bot className="h-5 w-5 text-black" />
                </div>
                <span className="text-lg font-bold text-white font-outfit tracking-tight lowercase">{BRAND}</span>
              </div>
              <p className="text-slate-500 max-w-xs font-medium leading-relaxed text-sm">
                One bot for your entire community — protection, leveling, tickets, and music in a single clean dashboard.
              </p>
            </div>
            <div className="space-y-5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Product</h4>
              <ul className="space-y-3.5 text-sm font-medium text-slate-400">
                <li><Link href="/#modules" className="hover:text-white transition-colors">Modules</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
            <div className="space-y-5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Legal</h4>
              <ul className="space-y-3.5 text-sm font-medium text-slate-400">
                <li><Link href="/docs" className="hover:text-white transition-colors">Docs</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-5">
            <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">
              © 2026 {BRAND} · Antinuke — Leveling — Tickets — Music.
            </p>
            <div className="flex items-center gap-3 text-[10px] font-black text-white uppercase tracking-[0.25em]">
              <div className="h-2 w-2 rounded-full bg-white dot-live" />
              All Nodes Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
