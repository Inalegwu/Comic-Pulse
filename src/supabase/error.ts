import { Data } from 'effect';

export class SupabaseError extends Data.TaggedError('supabase-error')<{
  cause: unknown;
}> {}

export class SupabaseClientInstantiationError
  extends Data.TaggedError('supabase-client-instantiation-error')<{
    cause: unknown;
  }> {}
