import "next-auth";
import "next-auth/jwt";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "ADMIN" | "CANDIDATE" | "EMPLOYER";
      accountType: "candidate" | "employer";
    };
  }

  interface User {
    role: "ADMIN" | "CANDIDATE" | "EMPLOYER";
    accountType?: "candidate" | "employer" | string;
    sessionVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "ADMIN" | "CANDIDATE" | "EMPLOYER";
    accountType?: "candidate" | "employer" | string;
    sessionVersion?: number;
    invalidSession?: boolean;
  }
}

