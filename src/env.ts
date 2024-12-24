import process from "node:process";
import dotenv from "dotenv";
import { cleanEnv, str } from "envalid";

dotenv.config({
  path: ".env",
});

export const Env = cleanEnv(process.env, {
  DATABASE_URL: str(),
  DATABASE_AUTH_TOKEN: str(),
});
