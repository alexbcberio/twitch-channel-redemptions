import { AccessToken, RefreshableAuthProvider, StaticAuthProvider } from "twitch-auth";
import { getTokenData, saveTokenData } from "./tokenData";

import { ApiClient } from "twitch";
import { TokenData } from "../../interfaces/TokenData";

const LOG_PREFIX = "[Twitch] ";

let refreshAuthProvider: RefreshableAuthProvider;

export {
  getAuthProvider,
  getApiClient,
  getUsernameFromId
}

interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

function getClientCredentials(): ClientCredentials {
  if (
    !process.env.TWITCH_CLIENT_ID ||
    !process.env.TWITCH_CLIENT_SECRET
  ) {
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

async function createStaticAuthProvider(): Promise<StaticAuthProvider> {
  let tokenData = await getTokenData();
  const credentials = getClientCredentials();

  return new StaticAuthProvider(
    credentials.clientId,
    tokenData.access_token
  );
}

async function getAuthProvider(): Promise<RefreshableAuthProvider> {
  if (refreshAuthProvider) {
    return refreshAuthProvider;
  }

  let tokenData = await getTokenData();

  const staticAuthProvider = await createStaticAuthProvider();
  const credentials = getClientCredentials();

  const expiry = tokenData.expiryTimestamp === null
    ? null
    : new Date(tokenData.expiryTimestamp);

  refreshAuthProvider = new RefreshableAuthProvider(
		staticAuthProvider,
		{
      clientSecret: credentials.clientSecret,
      refreshToken: tokenData.refresh_token,
			expiry,
      onRefresh: onRefresh
    }
  ) as RefreshableAuthProvider;

  return refreshAuthProvider;
}

async function onRefresh(refreshData: AccessToken): Promise<void> {
  const { accessToken, refreshToken, expiryDate } = refreshData;
  console.log(`${LOG_PREFIX}Tokens refreshed`);

  const expiryTimestamp = expiryDate === null
    ? 0
    : expiryDate.getTime()

  const newTokenData: TokenData = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expiryTimestamp
  };

  await saveTokenData(newTokenData);
}

async function getApiClient() {
  const authProvider = await getAuthProvider();

  return new ApiClient({ authProvider });
}

async function getUsernameFromId(userId: number) {
  const apiClient = await getApiClient();
  const user = await apiClient.helix.users.getUserById(userId);

  if (!user) {
    return null;
  }

  return user.displayName;
}