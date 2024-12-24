import { Config, Redacted } from "effect";
import { Env } from "../env.ts";

export const DatabaseConfig = Config.succeed({
  DATABASE_URL: Env.DATABASE_URL,
  DATABASE_AUTH_TOKEN: Redacted.make(Env.DATABASE_AUTH_TOKEN),
});
