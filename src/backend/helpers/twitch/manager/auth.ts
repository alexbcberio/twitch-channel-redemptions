import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import { getTokenData, saveTokenData } from "../../tokenData";
import { log, namespace } from "..";

import { ApiClient } from "@twurple/api";
import { ClientCredentials } from "../../../../interfaces/ClientCredentials";
import { error } from "../../log";

let refreshAuthProvider: RefreshingAuthProvider;
let apiClient: ApiClient | null = null;

function getClientCredentials(): ClientCredentials {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    error(
      "[%s] Missing environment parameters TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET",
      namespace
    );

    const exitCode = 1;

    process.exit(exitCode);
  }

  return {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
  };
}

async function onRefresh(refreshData: AccessToken): Promise<void> {
  log("Tokens refreshed");

  await saveTokenData(refreshData);
}

async function getAuthProvider(): Promise<RefreshingAuthProvider> {
  const tokenData = await getTokenData();

  if (!refreshAuthProvider) {
    const credentials = getClientCredentials();

    log("Creating RefreshingAuthProvider instance");
    refreshAuthProvider = new RefreshingAuthProvider(
      {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        onRefresh,
      },
      tokenData
    );
  }

  return refreshAuthProvider;
}

async function getApiClient(): Promise<ApiClient> {
  const authProvider = await getAuthProvider();

  if (apiClient === null) {
    log("Creating ApiClient instance");
    apiClient = new ApiClient({ authProvider });
  }

  return apiClient;
}

export { getAuthProvider, getApiClient };
