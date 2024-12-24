import { Config, Redacted } from "effect";

export const DatabaseConfig = Config.succeed({
  DATABASE_URL: Deno.env.get("DATABASE_URL"),
  DATABASE_AUTH_TOKEN: Redacted.make(Deno.env.get("DATABASE_AUTH_TOKEN")),
});
