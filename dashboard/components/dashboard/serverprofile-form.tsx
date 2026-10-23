/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Info,
  RefreshCcw,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ServerProfileConfig, ServerProfileUpdate } from "@/types/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ServerProfileFormProps {
  guildId: string;
  config: ServerProfileConfig;
}

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_NAME = 32;
const MAX_BIO = 190;

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file is not a supported image."));
    };
    image.src = url;
  });
}

/** Crop to the aspect ratio Discord expects and downscale before uploading. */
async function fileToDataUrl(file: File, kind: "avatar" | "banner"): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("Images must be 8 MB or smaller.");
  }

  const image = await readImage(file);
  const target = kind === "avatar" ? { width: 512, height: 512 } : { width: 960, height: 540 };
  const canvas = document.createElement("canvas");
  canvas.width = target.width;
  canvas.height = target.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Your browser could not process that image.");
  }

  const scale = Math.max(target.width / image.width, target.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.drawImage(image, (target.width - width) / 2, (target.height - height) / 2, width, height);

  return canvas.toDataURL("image/png");
}

export function ServerProfileForm({ guildId, config }: ServerProfileFormProps) {
  const [profile, setProfile] = useState<ServerProfileConfig>(config);
  const [displayName, setDisplayName] = useState(config.display_name ?? "");
  const [bio, setBio] = useState(config.bio ?? "");
  const [accent, setAccent] = useState(config.accent_color ?? "#5865F2");
  const [avatar, setAvatar] = useState<string | null>(config.avatar);
  const [banner, setBanner] = useState<string | null>(config.banner);
  const [clearAvatar, setClearAvatar] = useState(false);
  const [clearBanner, setClearBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  const previewName = displayName.trim() || profile.bot_name || "Alpha";
  const previewBio = bio.trim() || "No bio set for this server yet.";
  const previewAvatar = avatar || profile.bot_avatar;
  const previewBanner = banner;

  const handleUpload = async (file: File | undefined, kind: "avatar" | "banner") => {
    if (!file) return;
    setUploading(kind);
    try {
      const data = await fileToDataUrl(file, kind);
      if (kind === "avatar") {
        setAvatar(data);
        setClearAvatar(false);
      } else {
        setBanner(data);
        setClearBanner(false);
      }
      toast.success(`${kind === "avatar" ? "Avatar" : "Banner"} ready — save to apply it.`);
    } catch (error: any) {
      toast.error(error.message || "Could not read that image.");
    } finally {
      setUploading(null);
      if (avatarInput.current) avatarInput.current.value = "";
      if (bannerInput.current) bannerInput.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length > MAX_NAME) {
      toast.error(`Display name must be ${MAX_NAME} characters or fewer.`);
      return;
    }
    if (bio.trim().length > MAX_BIO) {
      toast.error(`Bio must be ${MAX_BIO} characters or fewer.`);
      return;
    }

    setSaving(true);
    try {
      const payload: ServerProfileUpdate = {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        accent_color: accent || null,
        avatar: clearAvatar ? null : avatar,
        banner: clearBanner ? null : banner,
        clear_avatar: clearAvatar,
        clear_banner: clearBanner,
      };
      const updated = await api.updateServerProfile(guildId, payload);
      setProfile(updated);
      setAvatar(updated.avatar);
      setBanner(updated.banner);
      setClearAvatar(false);
      setClearBanner(false);

      if (updated.synced) {
        toast.success("Server profile applied to Discord.");
      } else {
        toast.warning(updated.sync_error || "Saved, but Discord did not apply every change.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save the server profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    setResetting(true);
    try {
      const updated = await api.resetServerProfile(guildId);
      setProfile(updated);
      setDisplayName("");
      setBio("");
      setAccent("#5865F2");
      setAvatar(null);
      setBanner(null);
      setClearAvatar(false);
      setClearBanner(false);
      setConfirmReset(false);
      toast.success("Per-server profile cleared. The bot uses its global identity again.");
      if (!updated.synced && updated.sync_error) toast.warning(updated.sync_error);
    } catch (error: any) {
      toast.error(error.message || "Failed to reset the server profile.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-6">
        {/* Live preview */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-xl shadow-black/20">
          <div className="h-1 w-full" style={{ backgroundColor: accent }} />
          <div className="relative h-44 sm:h-52 w-full bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent">
            {previewBanner ? (
              <img src={previewBanner} alt="Banner preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-600">
                <ImageIcon className="h-4 w-4" />
                No per-server banner
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
          </div>

          <div className="relative -mt-12 px-6 pb-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-[#0a0a0a] bg-white/10 shadow-2xl"
                style={{ boxShadow: `0 0 0 2px ${accent}` }}
              >
                {previewAvatar ? (
                  <img src={previewAvatar} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserCircle2 className="h-10 w-10 text-slate-500" />
                  </div>
                )}
                <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[#0a0a0a] bg-emerald-400" />
              </div>

              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-2xl font-black tracking-tight text-white">{previewName}</h3>
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
                    style={{ backgroundColor: accent }}
                  >
                    App
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{previewBio}</p>
              </div>

              <div className="pb-1 text-right">
                {profile.synced ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> Synced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300">
                    <AlertTriangle className="h-3 w-3" /> Not synced
                  </span>
                )}
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                  Only visible in this server
                </p>
              </div>
            </div>
          </div>
        </div>

        {!profile.synced && profile.sync_error && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{profile.sync_error}</p>
          </div>
        )}

        {!profile.can_manage && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              The bot is missing the <strong>Change Nickname</strong> permission in this server. The avatar, banner
              and bio can still be applied, but the display name will not change until that permission is granted.
            </p>
          </div>
        )}

        {/* Editor */}
        <form onSubmit={handleSave} className="space-y-6 rounded-3xl border border-white/10 bg-[#0a0a0a] p-6 sm:p-8 shadow-xl shadow-black/20">
          <div className="flex items-center gap-3 border-b border-white/5 pb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <UserCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Identity</h3>
              <p className="text-xs text-slate-500">Discord shows this profile to members of this server only.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                <span>Display Name</span>
                <span className="font-mono text-[10px] text-slate-600">
                  {displayName.length}/{MAX_NAME}
                </span>
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, MAX_NAME))}
                placeholder={profile.bot_name || "Alpha"}
                maxLength={MAX_NAME}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                <span>Accent Colour</span>
                <span className="font-mono text-[10px] text-slate-600">{accent.toUpperCase()}</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(accent) ? accent : "#5865F2"}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-12 w-14 cursor-pointer rounded-xl border border-white/10 bg-white/[0.06] p-1"
                  aria-label="Accent colour"
                />
                <Input
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  placeholder="#5865F2"
                  maxLength={7}
                  className="font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-black uppercase tracking-widest text-slate-500">
              <span>Bio</span>
              <span className="font-mono text-[10px] text-slate-600">
                {bio.length}/{MAX_BIO}
              </span>
            </label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, MAX_BIO))}
              placeholder="A short description shown on the bot's per-server profile."
              rows={3}
              maxLength={MAX_BIO}
            />
            <p className="text-[11px] italic text-slate-600">
              Discord limits per-server bios to {MAX_BIO} characters.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Avatar upload */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Avatar</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Square</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                  {avatar ? (
                    <img src={avatar} alt="Avatar upload" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <UserCircle2 className="h-6 w-6 text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <input
                    ref={avatarInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0], "avatar")}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    disabled={uploading === "avatar"}
                    onClick={() => avatarInput.current?.click()}
                  >
                    {uploading === "avatar" ? (
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload
                  </Button>
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatar(null);
                        setClearAvatar(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Banner upload */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Banner</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">16:9</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-14 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/10">
                  {banner ? (
                    <img src={banner} alt="Banner upload" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <input
                    ref={bannerInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0], "banner")}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    disabled={uploading === "banner"}
                    onClick={() => bannerInput.current?.click()}
                  >
                    {uploading === "banner" ? (
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Upload
                  </Button>
                  {banner && (
                    <button
                      type="button"
                      onClick={() => {
                        setBanner(null);
                        setClearBanner(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:text-rose-300"
                    >
                      <Trash2 className="h-3 w-3" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={resetting || saving}
              className="gap-2 border-rose-400/20 text-rose-300 hover:bg-rose-400/10 hover:text-rose-200"
            >
              {resetting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {confirmReset ? "Confirm reset" : "Reset profile"}
            </Button>

            <div className="flex items-center gap-3">
              {confirmReset && (
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white"
                >
                  Cancel
                </button>
              )}
              <Button type="submit" disabled={saving} className="h-12 gap-2 px-8 font-bold">
                {saving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Applying..." : "Save & Apply"}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Info column */}
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] p-6">
          <div className="absolute -right-4 -top-4 opacity-[0.03]">
            <Sparkles className="h-32 w-32 text-white" />
          </div>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
            <Info className="h-4 w-4" /> How it works
          </h3>
          <div className="space-y-3 text-sm leading-relaxed text-slate-400">
            <p>
              Discord supports a <span className="font-bold text-white">separate bot profile per server</span>. This
              page edits the profile the bot uses inside{" "}
              <span className="font-bold text-white">this server only</span>; every other server keeps the global
              identity.
            </p>
            <p>
              Saving applies the new name, avatar, banner and bio immediately. A cached Discord client may take a
              moment, or a member-list refresh, to show the change.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
            <ImageIcon className="h-4 w-4" /> Limits
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li className="flex justify-between gap-4">
              <span>Display name</span>
              <span className="font-mono text-slate-500">{MAX_NAME} chars</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Bio</span>
              <span className="font-mono text-slate-500">{MAX_BIO} chars</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Image size</span>
              <span className="font-mono text-slate-500">8 MB</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Formats</span>
              <span className="font-mono text-slate-500">PNG · JPG · WEBP · GIF</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Avatar crop</span>
              <span className="font-mono text-slate-500">512 × 512</span>
            </li>
            <li className="flex justify-between gap-4">
              <span>Banner crop</span>
              <span className="font-mono text-slate-500">960 × 540</span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
            <Sparkles className="h-4 w-4" /> Also in Discord
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            Prefer chat? Members with <span className="font-bold text-white">Manage Server</span> can use{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">serverprofile</code>{" "}
            with the <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">name</code>,{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">avatar</code>,{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">banner</code>,{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">bio</code> and{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white">reset</code>{" "}
            subcommands.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-6">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
            <CheckCircle2 className="h-4 w-4" /> Last update
          </h3>
          <p className="text-xs text-slate-400">
            {profile.updated_at ? new Date(profile.updated_at).toLocaleString() : "Never updated"}
          </p>
        </div>
      </div>
    </div>
  );
}
