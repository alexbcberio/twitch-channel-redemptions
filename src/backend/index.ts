import { connect } from "./chatClient";
import { isProduction } from "./helpers/util";
import { listen } from "./helpers/webServer";
import { registerUserListener } from "./pubSubClient";
import { runWebpack } from "./helpers/webpack";

const LOG_PREFIX = "[APP] ";

const channel = process.env.TWITCH_CHANNEL_NAME;

export async function bootstrap() {
  if (!channel) {
    console.error(
      `${LOG_PREFIX}Missing environment parameter TWITCH_CHANNEL_NAME`
    );

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
