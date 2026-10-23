/**
 * © 2026 ItzFallenMe — All Rights Reserved
 * github ── https://github.com/ItzFallenMe
 */

import DiscordProvider from "next-auth/providers/discord";
import { AuthOptions } from "next-auth";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const TOKEN_REFRESH_WINDOW = 60 * 1000; // refresh 1 minute before expiry

type TokenWithDiscord = {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
  error?: string;
  [key: string]: any;
};

async function refreshAccessToken(token: TokenWithDiscord): Promise<TokenWithDiscord> {
  try {
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || "",
        client_secret: process.env.DISCORD_CLIENT_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken || "",
      }),
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      accessTokenExpires: Date.now() + (refreshed.expires_in ?? 604800) * 1000,
      error: undefined,
    };
  } catch (error) {
    console.error("Failed to refresh Discord access token:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: AuthOptions = {
  // Required for consistent session cookies in production.
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      // Required: Discord now sends `iss=https://discord.com` on callback,
      // and openid-client rejects it unless the issuer is configured.
      issuer: "https://discord.com",
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  session: {
    // JWT keeps the session valid between visits; Discord tokens are refreshed
    // below instead of forcing the user through OAuth again.
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 60 * 60 * 24,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : Date.now() + Number(account.expires_in ?? 604800) * 1000;
        return token;
      }

      if (
        token.accessTokenExpires &&
        Date.now() < Number(token.accessTokenExpires) - TOKEN_REFRESH_WINDOW
      ) {
        return token;
      }

      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.sub;
        // @ts-ignore
        session.accessToken = token.accessToken;
        // @ts-ignore
        session.error = token.error;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
