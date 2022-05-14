import { connect } from "./chatClient";
import { error } from "./helpers/log";
import { isProduction } from "./helpers/util";
import { listen } from "./webserver";
import { registerUserListener } from "./pubSubClient";
import { runWebpack } from "./helpers/webpack";

const namespace = "App";

const channel = process.env.TWITCH_CHANNEL_NAME;

export async function bootstrap() {
  if (!channel) {
    error("[%s] Missing environment parameter TWITCH_CHANNEL_NAME", namespace);

    const errorCode = 1;

    process.exit(errorCode);
  }

  await Promise.all([
    registerUserListener(channel),
    connect([channel]),
    listen(),
  ]);

  if (!isProduction) {
    await runWebpack();
  }
}
