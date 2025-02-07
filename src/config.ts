import dotenv from 'dotenv';
import { Config } from 'effect';

dotenv.config({
  path: '.env',
});

export const AppConfig = Config.succeed({
  SOURCE_URL: 'https://comixnow.com/category/dc-weekly/',
  BROKER_URL: '',
});
