import { Effect } from 'effect';
import { checkForComics } from './handlers/check-for-comics.ts';
import { informBroker } from './handlers/inform-broker.ts';

Deno.cron(
  'Check for new comics',
  '0 */2 * * 4',
  () =>
    Effect.runPromise(
      checkForComics,
    ),
);

Deno.cron(
  'Inform Broker',
  '0 */4 * * 3',
  () => Effect.runPromise(informBroker),
);
