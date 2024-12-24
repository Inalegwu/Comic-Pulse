import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { Env } from "../env.ts";
import * as schema from "./schema.ts";

const client = createClient({
  url: Env.DATABASE_URL,
  authToken: Env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
