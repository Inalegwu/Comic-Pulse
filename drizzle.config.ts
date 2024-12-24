import { defineConfig } from "drizzle-kit";
import { Env } from "./src/env.ts";

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: Env.DATABASE_URL,
    authToken: Env.DATABASE_AUTH_TOKEN,
  },
});
