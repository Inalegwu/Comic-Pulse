import { Config } from "effect";
import { Env } from "../env.ts";

export const DatabaseConfig = Config.all({
  DATBASE_URL: Config.succeed(Env.DATABASE_URL),
  DATABASE_AUTH_TOKEN: Config.redacted(Env.DATABASE_AUTH_TOKEN),
});
