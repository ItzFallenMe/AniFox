/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Bot, Scale, Terminal, ShieldAlert, Cpu, ArrowLeft, Ban, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "Alpha";

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

const SECTIONS = [
  {
    id: "acceptance",
    icon: Terminal,
    title: "Acceptance of Protocol",
    body: `By integrating the ${BRAND} Engine into your Discord server, you agree to abide by these terms. The engine is provided "as is," and while we strive for 100% uptime through our edge clusters, we are not liable for data loss resulting from third-party API disruptions.`,
    points: ["Terms apply the moment the bot joins your server", "Continued use after updates counts as acceptance", "Server owners are responsible for their staff's usage"],
  },
  {
    id: "constraints",
    icon: ShieldAlert,
    title: "Usage Constraints",
    body: `You may not use the ${BRAND} Engine for illicit activities, including but not limited to: automated harassment, token logging, or raid coordination. Violations result in immediate deauthorization and blacklisting from the network.`,
    points: ["No harassment, spam, or raid tooling", "No scraping user data beyond Discord's rules", "No evading punishments with alt accounts or token abuse"],
  },
  {
    id: "scaling",
    icon: Cpu,
    title: "API & Scaling",
    body: "We reserve the right to throttle API access for guilds with disproportionate resource usage. High-scale enterprise clusters exist for communities needing dedicated shards.",
    points: ["Fair-use limits keep the network fast for everyone", "Abuse triggers automatic throttling first, bans last", "Enterprise shards available for 10k+ member servers"],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans overflow-x-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      </div>

      <nav className="fixed top-4 inset-x-0 z-50 px-4">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between rounded-full border border-white/10 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_10px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.09)]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-white to-slate-500 flex items-center justify-center border border-white/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
              <Bot className="h-5 w-5 text-black" />
            </div>
            <span className="text-base font-bold text-white font-outfit tracking-tight">
              {BRAND} <span className="text-white">Engine</span>
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="rounded-full text-slate-400 hover:text-white gap-2 text-[11px] font-black uppercase tracking-widest">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-44 pb-28 px-5">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.07] border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.25em] mb-7">
              <Scale className="h-3 w-3" />
              Protocol v2.4
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white font-outfit tracking-tighter uppercase mb-6 leading-[0.95]">
              Terms of{" "}
              <span className="text-shimmer bg-gradient-to-r from-white via-slate-300 to-white bg-clip-text text-transparent italic">
                Service.
              </span>
            </h1>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mb-10">
              The short, readable version of the rules. Three sections, no legal maze.
            </p>
            <div className="flex flex-wrap gap-3 mb-16">
              {SECTIONS.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="px-5 py-2.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/[0.05] transition-all"
                >
                  {String(i + 1).padStart(2, "0")} · {s.title}
                </a>
              ))}
            </div>
          </Reveal>

          <div className="space-y-6">
            {SECTIONS.map((s, i) => (
              <Reveal key={s.id} delay={i * 90}>
                <section
                  id={s.id}
                  className="group rounded-[2rem] border border-white/[0.06] bg-white/[0.012] hover:border-white/25 hover:bg-white/[0.02] transition-all duration-500 p-8 md:p-12 scroll-mt-32"
                >
                  <div className="flex items-center gap-5 mb-6">
                    <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                      <s.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/80 mb-1">
                        Clause {String(i + 1).padStart(2, "0")}
                      </p>
                      <h2 className="text-2xl md:text-3xl font-bold text-white font-outfit uppercase tracking-tight">{s.title}</h2>
                    </div>
                  </div>
                  <p className="text-slate-400 leading-relaxed font-medium mb-7">{s.body}</p>
                  <ul className="space-y-3">
                    {s.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-10 rounded-[2rem] border border-white/20 bg-white/[0.03] p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/10 border border-white/25 flex items-center justify-center">
                <Ban className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white font-outfit uppercase tracking-tight mb-2">Zero tolerance, fairly applied</h3>
                <p className="text-sm text-slate-400 font-medium">
                  Enforcement is automated but appealable — every action lands in your log channel with a reason attached.
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.07] text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Gauge className="h-3.5 w-3.5 text-white" />
                Fair-use metered
              </div>
            </div>
          </Reveal>

          <p className="mt-10 text-center text-[10px] font-black uppercase text-slate-700 tracking-[0.35em]">
            March 2026 // Distributed via {BRAND} Cloud
          </p>
        </div>
      </main>
    </div>
  );
}
