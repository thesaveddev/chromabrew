import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // A GitHub email that matches an existing account belongs to the same
      // person — GitHub verifies addresses before marking them primary, so
      // linking on match is what un-breaks "Continue with GitHub" for
      // anyone who first signed up with email + password.
      allowDangerousEmailAccountLinking: true,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Google addresses are verified by definition; same reasoning as above.
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.passwordHash) return null;

        const valid = await compare(
          credentials.password as string,
          user.passwordHash,
        );

        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) token.id = user.id;
      // OAuth never syncs the profile back to an existing row: a user created
      // by email signup (nameless) who later links GitHub would stay
      // "Unnamed" forever. Fill the blanks from the provider profile once —
      // never overwrite a name the user set themselves.
      if (account && profile && user && (!user.name || !user.image)) {
        const p = profile as Record<string, unknown>;
        const str = (v: unknown) =>
          typeof v === "string" && v.trim() ? v.trim() : null;
        // GitHub often has no public name; the username is the fallback.
        // Google provides name + picture directly.
        const name = str(p.name) ?? str(p.login);
        const image = str(p.avatar_url) ?? str(p.picture);
        if ((name && !user.name) || (image && !user.image)) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                ...(user.name ? {} : name ? { name } : {}),
                ...(user.image ? {} : image ? { image } : {}),
              },
            });
            if (name && !token.name) token.name = name;
            if (image && !token.picture) token.picture = image;
          } catch (error) {
            console.error("[auth] profile backfill failed", error);
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      return session;
    },
  },
});
