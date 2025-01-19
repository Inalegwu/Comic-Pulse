import { Effect } from 'effect';
import { checkForComics } from './handlers/check-for-comics.ts';
import { informBroker } from './handlers/inform-broker.ts';

Deno.cron(
  'Check for new comics',
  '* */2 * * 3',
  () =>
    Effect.runPromise(
      checkForComics,
    ),
);

Deno.cron(
  'Inform Broker',
  '* */4 * * 2',
  () => Effect.runPromise(informBroker),
);
