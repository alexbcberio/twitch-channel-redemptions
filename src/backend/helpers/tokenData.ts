import { AccessToken } from "@twurple/auth";
import { promises as fs } from "fs";
import { resolve } from "path";

const TOKENS_FILE = "tokens.json";
const LOG_PREFIX = "[TokenData] ";

export { getTokenData, saveTokenData };

function getTokenDataFilePath(): string {
	return resolve(process.cwd(), TOKENS_FILE);
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
		process.exit(1);
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

function checkTokenData(tokenData: AccessToken): void {
	if (!tokenData.accessToken || !tokenData.refreshToken) {
		console.error(
			`${LOG_PREFIX}Missing refresh_token or access_token in ${TOKENS_FILE}.`
		);
		process.exit(1);
	}
}
