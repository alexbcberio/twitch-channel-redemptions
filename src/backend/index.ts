import { getApiClient, getAuthProvider } from "./helpers/twitch";

import { connect } from "./chatClient";
import { listen } from "./webServer";
import { registerUserListener } from "./pubSubClient";

const channel = "alexbcberio";

export async function bootstrap() {

  const apiClient = await getApiClient();
  await registerUserListener(apiClient, channel);

  const authProvider = await getAuthProvider();
  await connect(authProvider, [channel]);

  listen();
}