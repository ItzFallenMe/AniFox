/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-[#0a0a0a] group-[.toaster]:text-slate-200 group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4",
          description: "group-[.toast]:text-slate-500 group-[.toast]:text-[11px] group-[.toast]:font-medium",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-slate-400",
          success: "group-[.toaster]:border-white/50 group-[.toaster]:bg-white/5",
          error: "group-[.toaster]:border-white/50 group-[.toaster]:bg-white/5",
          loading: "group-[.toaster]:border-primary/50 group-[.toaster]:bg-primary/5",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
