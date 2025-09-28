import { Effect } from 'effect';
import { checkForComics } from './handlers/check-for-comics.ts';

Deno.cron(
  'Check for new comics',
  '* 10 * * 5',
  () => checkForComics.pipe(Effect.runPromise),
);

