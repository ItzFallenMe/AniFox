"use client";

export function ErrorNotice({ message }: { message: string }) {
  return (
    <div className="notice-error mx-6 mt-6 animate-pop-in rounded-2xl border p-4 text-sm lg:mx-20" role="alert">
      {message}
    </div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="empty-state-panel mx-6 flex flex-col items-center justify-center px-6 py-20 text-center lg:mx-20">
      <p className="font-display text-lg font-bold text-white">{title}</p>
      {subtitle ? <p className="mt-2 max-w-sm text-sm text-white/45">{subtitle}</p> : null}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="px-6 pt-8 lg:px-20">
      <div className="skeleton mb-4 h-5 w-40 rounded-md" />
      <div className="flex gap-3 overflow-hidden pt-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="skeleton aspect-[2/3] w-[130px] shrink-0 rounded-lg md:w-[160px] lg:w-[185px]"
          />
        ))}
      </div>
    </div>
  );
}
