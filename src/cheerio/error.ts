import { Data } from 'effect';

export class CheerioError extends Data.TaggedError('cheerio-error')<{
  cause: unknown;
}> {}

export class SaveError extends Data.TaggedError('save-error')<{
  cause: unknown;
}> {}
