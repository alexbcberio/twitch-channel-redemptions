import { connect } from "./chatClient";
import { listen } from "./helpers/webServer";
import { registerUserListener } from "./pubSubClient";

const channel = "alexbcberio";

export async function bootstrap() {
  await Promise.all([
    registerUserListener(channel),
    connect([channel]),
  ]);

  listen();
}