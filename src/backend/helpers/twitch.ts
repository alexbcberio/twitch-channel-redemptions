import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import { getTokenData, saveTokenData } from "./tokenData";

import { ApiClient } from "@twurple/api";
import { ClientCredentials } from "../../interfaces/ClientCredentials";

const LOG_PREFIX = "[Twitch] ";

let refreshAuthProvider: RefreshingAuthProvider;

export { getAuthProvider, getApiClient, getUsernameFromId };

function getClientCredentials(): ClientCredentials {
	if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
		console.error(
			`${LOG_PREFIX}Missing environment parameters TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET`
		);
		process.exit(1);
	}

	return {
		clientId: process.env.TWITCH_CLIENT_ID,
		clientSecret: process.env.TWITCH_CLIENT_SECRET
	};
}

async function getAuthProvider(): Promise<RefreshingAuthProvider> {
	if (refreshAuthProvider) {
		return refreshAuthProvider;
	}

	let tokenData = await getTokenData();

	const credentials = getClientCredentials();

	refreshAuthProvider = new RefreshingAuthProvider(
		{
			clientId: credentials.clientId,
			clientSecret: credentials.clientSecret,
			onRefresh
		},
		tokenData
	);

	return refreshAuthProvider;
}

async function onRefresh(refreshData: AccessToken): Promise<void> {
	console.log(`${LOG_PREFIX}Tokens refreshed`);

	await saveTokenData(refreshData);
}

async function getApiClient(): Promise<ApiClient> {
	const authProvider = await getAuthProvider();

	return await new ApiClient({ authProvider });
}

async function getUsernameFromId(userId: number): Promise<string | null> {
	const apiClient = await getApiClient();
	const user = await apiClient.helix.users.getUserById(userId);

	if (!user) {
		return null;
	}

	return user.displayName;
}
