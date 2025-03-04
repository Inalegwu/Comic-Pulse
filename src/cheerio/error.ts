import { Data } from 'effect';

export class CheerioError extends Data.TaggedError('cheerio-error')<{
  cause: unknown;
}> {}
