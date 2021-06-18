import { getApiClient, getAuthProvider, } from "./src/backend/helpers/twitch";

import { connect } from "./src/backend/chatClient";
import { listen, } from "./src/backend/webServer";
import { registerUserListener } from "./src/backend/pubSubClient";

const channel = "alexbcberio";

async function init() {

  const apiClient = await getApiClient();
  await registerUserListener(apiClient, channel);

  const authProvider = await getAuthProvider();
  await connect(authProvider, [channel]);

  listen();
}

init();