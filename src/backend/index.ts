import { connect } from "./chatClient";
import { error } from "./helpers/log";
import { isDevelopment } from "./helpers/util";
import { registerUserListener } from "./pubSubClient";
import { runWebpack } from "./helpers/webpack";
import { start } from "./webserver";

const namespace = "App";

let runningWebpack = false;

export async function bootstrap() {
  if (isDevelopment && runningWebpack === false) {
    runningWebpack = true;
    await runWebpack();
  }

  const channel = process.env.TWITCH_CHANNEL_NAME;

  if (typeof channel !== "string") {
    error("[%s] Missing environment parameter TWITCH_CHANNEL_NAME", namespace);
    return;
  }

  await Promise.all([
    registerUserListener(channel),
    connect([channel]),
    start(),
  ]);
}
