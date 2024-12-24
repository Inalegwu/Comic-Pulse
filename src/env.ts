import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";
import process from "node:process";

dotenv.config({
  path: ".env",
});

export const Env = cleanEnv(process.env, {
  DATABASE_URL: str(),
  DATABASE_AUTH_TOKEN: str(),
});
