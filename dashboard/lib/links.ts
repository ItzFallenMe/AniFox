/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

/**
 * Public links used across the dashboard.
 *
 * Set these in `.env.local` (see `.env.example`) so links can change without
 * editing any page. NEXT_PUBLIC_* values are inlined at build time.
 */
export const SUPPORT_URL =
  process.env.NEXT_PUBLIC_SUPPORT_SERVER_URL || "https://github.com/ItzFallenMe";

export const INVITE_URL =
  process.env.NEXT_PUBLIC_BOT_INVITE_URL ||
  "https://discord.com/oauth2/authorize?client_id=1560512882251145297&permissions=8&integration_type=0&scope=bot+applications.commands";

export const WEBSITE_URL =
  process.env.NEXT_PUBLIC_WEBSITE_URL || "https://github.com/ItzFallenMe";

export const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/ItzFallenMe";

export const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || "/docs";

export const VOTE_URL = process.env.NEXT_PUBLIC_VOTE_URL || "";
