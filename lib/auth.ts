import type { AuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertRateLimit } from "@/lib/rate-limit";

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  otp: z.string().optional(),
});

export const authOptions: AuthOptions = {
  secret: authSecret,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const settings = await prisma.siteSettings.findUnique({
          where: { id: "default" },
          select: { loginRateLimitPerHour: true },
        });

        const ipHeader = req?.headers?.["x-forwarded-for"];
        const ip = Array.isArray(ipHeader) ? ipHeader[0] : (ipHeader?.split(",")[0]?.trim() || "unknown");

        try {
          await assertRateLimit("LOGIN", settings?.loginRateLimitPerHour ?? 20, ip);
        } catch {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user) {
          return null;
        }

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        if (user.role !== "ADMIN" && !user.emailVerified) {
          return null;
        }

        if (user.role === "ADMIN") {
          const settings = await prisma.siteSettings.findUnique({
            where: { id: "default" },
            select: { adminTwoFactorRequired: true },
          });

          if (settings?.adminTwoFactorRequired) {
            const otp = (parsed.data.otp || "").trim();
            if (!otp) {
              return null;
            }

            const challenge = await prisma.adminLoginOtp.findFirst({
              where: {
                userId: user.id,
                consumedAt: null,
                expiresAt: { gte: new Date() },
              },
              orderBy: { createdAt: "desc" },
            });

            if (!challenge) {
              return null;
            }

            const otpValid = await bcrypt.compare(otp, challenge.codeHash);
            if (!otpValid) {
              await prisma.adminLoginOtp.update({
                where: { id: challenge.id },
                data: { attempts: { increment: 1 } },
              });
              return null;
            }

            await prisma.adminLoginOtp.update({
              where: { id: challenge.id },
              data: { consumedAt: new Date() },
            });
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          accountType: user.accountType,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accountType = (user as { accountType?: string }).accountType ?? "candidate";
        token.sessionVersion = (user as { sessionVersion?: number }).sessionVersion ?? 0;
        token.name = user.name;
        token.email = user.email;
      } else if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { sessionVersion: true, name: true, email: true, role: true, accountType: true },
        });
        if (!dbUser || dbUser.sessionVersion !== (token.sessionVersion ?? 0)) {
          token.invalidSession = true;
        } else {
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.role = dbUser.role;
          token.accountType = dbUser.accountType || "candidate";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.invalidSession || !token.id || !token.role) {
        return null as never;
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "CANDIDATE" | "EMPLOYER";
        session.user.accountType = (token.accountType as "candidate" | "employer" | undefined) ?? "candidate";
        session.user.name = (token.name as string | undefined) ?? null;
        session.user.email = (token.email as string | undefined) ?? null;
      }

      return session;
    },
  },
};

export function getCurrentSession() {
  return getServerSession(authOptions).catch(() => null);
}


