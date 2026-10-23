/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

import React from "react";
import { UserCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { ServerProfileForm } from "@/components/dashboard/serverprofile-form";

export const revalidate = 0;

export default async function ServerProfilePage({ params }: { params: { guildId: string } }) {
  const profile = await api.getServerProfile(params.guildId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
          <UserCircle2 className="h-6 w-6 text-primary" />
          Server Profile
        </h2>
        <p className="text-slate-400">
          Give the bot its own name, avatar, banner and bio in this server — without changing how it looks anywhere
          else.
        </p>
      </div>

      <ServerProfileForm guildId={params.guildId} config={profile} />
    </div>
  );
}
