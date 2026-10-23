/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
