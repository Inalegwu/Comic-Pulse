import dotenv from "dotenv";
import { Config } from "effect";
import { cleanEnv, str } from "envalid";
import process from "node:process";

dotenv.config({
	path: ".env",
});

const Env = cleanEnv(process.env, {
	BLUESKY_EMAIL: str(),
	BLUESKY_PASSWORD: str(),
});

export const BlueSkyLiveConfig = Config.succeed({
	BLUESKY_EMAIL: Deno.env.get("BLUESKY_ACCOUNT_EMAIL"),
	BLUESKY_PASSWORD: Deno.env.get("BLUESKY_ACCOUNT_PASSWORD"),
});

export const BlueSkyDevConfig = Config.succeed({
	BLUESKY_EMAIL: Env.BLUESKY_EMAIL,
	BLUESKY_PASSWORD: Env.BLUESKY_PASSWORD,
});
