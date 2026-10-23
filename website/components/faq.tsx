'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Reveal } from './motion';
import { FAQS } from '@/lib/links';

const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative z-10 px-6 py-32">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-14 text-center">
            <p className="mb-5 text-[10px] font-black uppercase tracking-[0.35em] text-brand">
              — Questions
            </p>
            <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-white md:text-6xl">
              Before you install
            </h2>
          </div>
        </Reveal>

        <div className="space-y-4">
          {FAQS.map((item, index) => {
            const isOpen = open === index;
            return (
              <Reveal key={item.q} delay={index * 60}>
                <div
                  onClick={() => setOpen(isOpen ? null : index)}
                  className={cn(
                    'cursor-pointer overflow-hidden rounded-[1.75rem] border transition-all duration-500',
                    isOpen
                      ? 'border-brand/30 bg-white/[0.03] shadow-[0_10px_50px_rgba(255,122,26,0.08)]'
                      : 'border-white/[0.05] bg-white/[0.01] hover:border-white/15',
                  )}
                >
                  <div className={cn(isOpen && 'faq-open')}>
                    <div className="flex items-center justify-between gap-6 p-6 md:p-8">
                      <h3 className="font-display text-base font-bold uppercase tracking-tight text-white md:text-lg">
                        {item.q}
                      </h3>
                      <div className="faq-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.06]">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="faq-answer">
                      <div>
                        <p className="px-6 pb-7 text-sm font-medium leading-relaxed text-muted md:px-8 md:pb-8 md:text-base">
                          {item.a}
                        </p>
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
  );
}
