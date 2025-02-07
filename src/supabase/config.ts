import dotenv from 'dotenv';
import { Config } from 'effect';
import { cleanEnv, str } from 'envalid';
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
  SUPABASE_URL: str(),
  SUPABASE_KEY: str(),
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

// the deno environment api doesn't exist for local environments
// so I have to focus on using the default env with node and some
// environment validations.
// this also helps with database branching, I can be sure that the database
// used in development is different from the one in production
// by simply having a .dev file present in the code base
export const SupabaseDevConfig = Config.succeed({
  SUPABASE_URL: Env.SUPABASE_URL,
  SUPABASE_KEY: Env.SUPABASE_KEY,
});
