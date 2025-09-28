import dotenv from 'dotenv';
import { Config } from 'effect';
import { cleanEnv, url } from 'envalid';
import process from 'node:process';

// ensure that the appropriate environment
// file is available based on the path passed
// to it
dotenv.config({
  path: '.env',
});

// clean and typed environment, ensures environment variables
// are present and errors when they aren't
const Env = cleanEnv(process.env, {
  POCKETBASE_URL: url(),
});

// This ensures that in a live environment(Deno Deploy), the environment
// variables are pulled from the right source, the deno environment api
// helps with this
export const SupabaseLiveConfig = Config.succeed({
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  SUPABASE_URL: Deno.env.get('SUPABASE_URL')!,
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  SUPABASE_KEY: Deno.env.get('SUPABASE_KEY')!,
});

export const PocketbaseLiveConfig = Config.succeed({});

export const PocketbaseDevConfig = Config.succeed({
  POCKETBASE_URL: Env.POCKETBASE_URL,
});
