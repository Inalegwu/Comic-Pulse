import { Data } from 'effect';

export class SupabaseError extends Data.TaggedError('supabase-error')<{
  cause: unknown;
}> {}
