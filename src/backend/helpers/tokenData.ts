import { AccessToken } from "@twurple/auth";
import { promises as fs } from "fs";
import { resolve } from "path";

const TOKENS_FILE = "tokens.json";
const LOG_PREFIX = "[TokenData] ";

function getTokenDataFilePath(): string {
  return resolve(process.cwd(), TOKENS_FILE);
}

function checkTokenData(tokenData: AccessToken): void {
  if (!tokenData.accessToken || !tokenData.refreshToken) {
    console.error(
      `${LOG_PREFIX}Missing refreshToken or accessToken in ${TOKENS_FILE}.`
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
    console.error(
      `${LOG_PREFIX}${TOKENS_FILE} not found on ${tokenDataFilePath}.`
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
  console.log(`${LOG_PREFIX}Token data saved`);
}

export { getTokenData, saveTokenData };
