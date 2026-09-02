import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db/client";
import * as schema from "@/db/schema";
import { config } from "@/lib/config";

export const auth = betterAuth({
  appName: "At The Open",
  baseURL: config.authUrl,
  secret: config.authSecret,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  rateLimit: {
    enabled: true,
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      joins: true,
    },
  },
  plugins: [nextCookies()],
});
