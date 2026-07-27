// Shared NextAuth config — used by the route handler AND getServerSession calls.

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { createAdminSupabase, type DBUser } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        let admin;
        try {
          admin = createAdminSupabase();
        } catch {
          console.warn(
            "[auth] Supabase isn't configured yet — add SUPABASE_SERVICE_ROLE_KEY to .env.local."
          );
          return null;
        }

        const { data: user } = await admin
          .from("users")
          .select("*")
          .eq("email", credentials.email.toLowerCase())
          .maybeSingle<DBUser>();

        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.nickname = user.nickname;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id;
      session.user.nickname = token.nickname;
      return session;
    },
  },

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },
};
