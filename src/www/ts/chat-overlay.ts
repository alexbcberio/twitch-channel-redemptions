import "@fontsource/noto-sans-mono";

import {
  handleChatMessageAction,
  handleChatRemoveMessageAction,
  handleUserBanMessageAction,
  handleUserTimeoutMessageAction,
  isChatMessage,
  isChatRemoveMessage,
  isUserBanMessage,
  isUserTimeoutMessage,
} from "./events/chat";

import { BaseChatEvent } from "../../interfaces/events/chat/BaseChatEvent";

document.addEventListener("DOMContentLoaded", init);

const WS_MAX_RECONNECT_TIMEOUT = 5e3;

let ws: WebSocket;
let reconnectAttempt = 0;
let env: "dev" | "prod";

function init() {
  createWebSocket();
}

function createWebSocket() {
  const { protocol, host } = location;

  ws = new WebSocket(`${protocol.replace("http", "ws")}//${host}`);

  ws.addEventListener("open", onOpen);
  ws.addEventListener("message", onMessage);
  ws.addEventListener("close", reconnect);
}

function onOpen(this: WebSocket) {
  console.log("Connected");
}

function reconnect() {
  const reconnectTimeout = Math.min(
    125 * Math.pow(2, reconnectAttempt++),
    WS_MAX_RECONNECT_TIMEOUT
  );

  console.log(`Reconnecting in ${reconnectTimeout}ms`);

  if (env === "dev") {
    setTimeout(async () => {
      try {
        await fetch(location.href);

        location.reload();
      } catch (e) {
        setTimeout(reconnect);
      }
    }, reconnectTimeout);

    return;
  }

  setTimeout(createWebSocket, reconnectTimeout);
}

function onMessage(messageEvent: MessageEvent<string>) {
  reconnectAttempt = 0;

  if (!env) {
    env = JSON.parse(messageEvent.data).env;
    return;
  }

  const action: BaseChatEvent = JSON.parse(messageEvent.data);

  if (isChatMessage(action)) {
    handleChatMessageAction(action);
  } else if (isChatRemoveMessage(action)) {
    handleChatRemoveMessageAction(action);
  } else if (isUserTimeoutMessage(action)) {
    handleUserTimeoutMessageAction(action);
  } else if (isUserBanMessage(action)) {
    handleUserBanMessageAction(action);
  }
}
