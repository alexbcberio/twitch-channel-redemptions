import { error, extendLogger } from "./log";

import { AccessToken } from "@twurple/auth";
import { promises as fs } from "fs";
import { resolve } from "path";

const TOKENS_FILE = "tokens.json";

const namespace = "TokenData";
const log = extendLogger(namespace);

function getTokenDataFilePath(): string {
  return resolve(process.cwd(), TOKENS_FILE);
}

function checkTokenData(tokenData: AccessToken): void {
  if (!tokenData.accessToken || !tokenData.refreshToken) {
    error(
      "[%s] Missing refreshToken or accessToken in %s.",
      namespace,
      TOKENS_FILE
    );

    const exitCode = 1;

    process.exit(exitCode);
  }
}

async function getTokenData(): Promise<AccessToken> {
  const tokenDataFilePath = getTokenDataFilePath();
  let buffer: Buffer;

  try {
    buffer = await fs.readFile(tokenDataFilePath);
  } catch (e) {
    error(
      "[%s] %s not found on %s.",
      namespace,
      TOKENS_FILE,
      tokenDataFilePath
    );

    const exitCode = 1;

    process.exit(exitCode);
  }

  const tokenData = await JSON.parse(buffer.toString());

  checkTokenData(tokenData);

  return tokenData;
}

async function saveTokenData(tokenData: AccessToken): Promise<void> {
  const tokenDataFilePath = getTokenDataFilePath();
  const jsonTokenData = JSON.stringify(tokenData);

  await fs.writeFile(tokenDataFilePath, jsonTokenData);
  log("Token data saved");
}

export { getTokenData, saveTokenData };
