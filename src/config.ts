import dotenv from "dotenv";
import { Config } from "effect";

dotenv.config({
  path: ".env",
});

export const ScraperConfig = Config.succeed({
  SOURCE_URL: "https://comixnow.com/category/dc-weekly/",
});
