/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Bot, ShieldCheck, Lock, Eye, FileText, ArrowLeft, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    id: "collection",
    icon: Eye,
    title: "Data Collection",
    body: "The Alpha Engine collects only the minimum necessary data to function within Discord. This includes your Discord User ID, Server (Guild) ID, and configuration settings provided during setup. We do not store message content unless explicitly configured for logging purposes by server administrators.",
    points: ["Discord User IDs and Guild IDs", "Module configuration you explicitly save", "Log-channel output only when you enable logging"],
  },
  {
    id: "integrity",
    icon: Lock,
    title: "Data Integrity",
    body: "Configuration data is stored on the bot's host in a local database and is used only to run the features your server enables. We never sell or distribute your data to third parties.",
    points: ["Stored on the bot host", "No sale or sharing of your data", "Deleted when you remove the configuration"],
  },
  {
    id: "rights",
    icon: FileText,
    title: "User Rights",
    body: "You have the right to request a full dump of your data or immediate deletion of all configurations tied to your Discord account or guild — no questions, no retention games.",
    points: ["Request a full export of your stored data", "Request immediate deletion of guild configurations", "Deletion is applied when the request is processed"],
  },
];

export default function PrivacyPage() {
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
              Alpha <span className="text-white">Engine</span>
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
              <ShieldCheck className="h-3 w-3" />
              Privacy Shield v2.0
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white font-outfit tracking-tighter uppercase mb-6 leading-[0.95]">
              Privacy{" "}
              <span className="text-shimmer bg-gradient-to-r from-white via-slate-300 to-white bg-clip-text text-transparent italic">
                Policy.
              </span>
            </h1>
            <p className="text-lg text-slate-400 font-medium max-w-2xl mb-10">
              Plain-language rules for what we collect, how we protect it, and what control you keep.
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
                        Section {String(i + 1).padStart(2, "0")}
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
            <div className="mt-10 rounded-[2rem] border border-white/[0.06] bg-black/30 p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white font-outfit uppercase tracking-tight mb-2">Take your data with you</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Export everything we store, or wipe it entirely — straight from the dashboard.
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl gap-2 border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-white text-xs font-black uppercase tracking-widest">
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button className="btn-shine rounded-xl gap-2 bg-white hover:bg-white border-none text-white text-xs font-black uppercase tracking-widest">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          </Reveal>

          <p className="mt-10 text-center text-[10px] font-black uppercase text-slate-700 tracking-[0.35em]">
            Last Modified: March 2026 // Jurisdiction: Global Edge Network
          </p>
        </div>
      </main>
    </div>
  );
}
