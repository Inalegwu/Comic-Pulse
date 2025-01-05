import dotenv from 'dotenv';
import { Config } from 'effect';
import { cleanEnv, str } from 'envalid';
import process from 'node:process';

dotenv.config({
  path: '.env',
});

const Env = cleanEnv(process.env, {
  SUPABASE_URL: str(),
  SUPABASE_KEY: str(),
});

export const SupabaseLiveConfig = Config.succeed({
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  SUPABASE_URL: Deno.env.get('SUPABASE_URL')!,
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  SUPABASE_KEY: Deno.env.get('SUPABASE_KEY')!,
});

export const SupabaseDevConfig = Config.succeed({
  SUPABASE_URL: Env.SUPABASE_URL,
  SUPABASE_KEY: Env.SUPABASE_KEY,
});
