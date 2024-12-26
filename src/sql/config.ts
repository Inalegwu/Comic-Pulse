import dotenv from "dotenv";
import { Config, Redacted } from "effect";
import { cleanEnv, str, url } from "envalid";
import process from "node:process";

dotenv.config({
  path: ".env",
});

const env = cleanEnv(process.env, {
  DATABASE_URL: url(),
  DATABASE_AUTH_TOKEN: str(),
});

export const DatabaseConfig = Config.succeed({
  // biome-ignore lint/style/noNonNullAssertion: it'll be there
  DATABASE_URL: Deno.env.get("DATABASE_URL")!,
  // biome-ignore lint/style/noNonNullAssertion: it'll be there
  DATABASE_AUTH_TOKEN: Redacted.make(Deno.env.get("DATABASE_AUTH_TOKEN")!),
});

export const TestConfig = Config.succeed({
  DATABASE_URL: env.DATABASE_URL,
  DATABASE_AUTH_TOKEN: Redacted.make(env.DATABASE_AUTH_TOKEN),
});
