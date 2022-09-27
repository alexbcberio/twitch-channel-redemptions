import { install, start } from "./webserver";

import { connect } from "./chatClient";
import { error } from "./helpers/log";
import { isDevelopment } from "./helpers/util";
import { registerUserListener } from "./pubSubClient";
import { runWebpack } from "./helpers/webpack";

const namespace = "App";

function isSetUp() {
  const { env } = process;

  return (
    typeof env.TWITCH_CLIENT_ID !== "undefined" &&
    typeof env.TWITCH_CLIENT_SECRET !== "undefined" &&
    typeof env.TWITCH_CHANNEL_NAME !== "undefined"
  );
}

let runningWebpack = false;

export async function bootstrap() {
  if (isDevelopment && runningWebpack === false) {
    runningWebpack = true;
    await runWebpack();
  }

  if (!isSetUp()) {
    await install();
    return;
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
