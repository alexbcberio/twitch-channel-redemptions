import "@fontsource/noto-sans-mono";

import { ChatMessageEvent } from "../../interfaces/events/ChatMessageEvent";
import { ChatMessageRemoveEvent } from "../../interfaces/events/ChatMessageRemoveEvent";
import { Event } from "../../interfaces/events/Event";
import { EventType } from "../../enums/EventType";
import { UserBan } from "../../interfaces/events/UserBan";
import { UserTimeout } from "../../interfaces/events/UserTimeout";
import { animate } from "./helpers/animate.css";

document.addEventListener("DOMContentLoaded", init);

const WS_MAX_RECONNECT_TIMEOUT = 5e3;
const REMOVE_MESSAGE_AFTER_MS = 2 * 60e3;

let ws: WebSocket;
let reconnectAttempt = 0;
let env: "dev" | "prod";

let messagesElement: Element;

function init() {
  createWebSocket();

  const messages = document.querySelector("#messages");

  if (messages === null) {
    return;
  }

  messagesElement = messages;
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

  const action: Event = JSON.parse(messageEvent.data);

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

function isChatMessage(action: Event): action is ChatMessageEvent {
  return action.type === EventType.ChatMessage;
}

function isChatRemoveMessage(action: Event): action is ChatMessageRemoveEvent {
  return action.type === EventType.ChatMessageRemove;
}

function isUserTimeoutMessage(action: Event): action is UserTimeout {
  return action.type === EventType.UserTimeout;
}

function isUserBanMessage(action: Event): action is UserBan {
  return action.type === EventType.UserBan;
}

function handleChatMessageAction(action: ChatMessageEvent) {
  const message = createUserMessage(action);
  messagesElement.appendChild(message);

  animate(message, "fadeInUp");

  removeOverflowedMessages();
}

async function handleChatRemoveMessageAction(action: ChatMessageRemoveEvent) {
  const messageElement = document.querySelector(
    `[data-message-id="${action.data.messageId}"]`
  );

  if (!messageElement) {
    return;
  }

  await removeMessage(messageElement as HTMLElement);
}

function handleUserTimeoutMessageAction(action: UserTimeout) {
  removeUserMessages(action.userId);
}

async function handleUserBanMessageAction(action: UserBan) {
  removeUserMessages(action.userId);
}

function createUserMessage(chatMessageAction: ChatMessageEvent) {
  const { userId, data } = chatMessageAction;
  const { user, message } = data;

  const messageElement = document.createElement("p");
  messageElement.classList.add("message");

  const userElement = document.createElement("span");
  userElement.classList.add("user");

  if (user.isMod) {
    userElement.classList.add("mod-user");
  }

  userElement.style.setProperty("--message-color", user.color);
  userElement.innerText = user.name;

  messageElement.setAttribute("data-message-id", message.id);
  messageElement.setAttribute("data-user-id", userId);
  messageElement.innerText = message.text;
  messageElement.insertAdjacentElement("afterbegin", userElement);

  setTimeout(async () => {
    removeMessage(messageElement);
  }, REMOVE_MESSAGE_AFTER_MS);

  return messageElement;
}

async function removeUserMessages(userId: string) {
  const messages = document.querySelectorAll(`[data-user-id="${userId}"]`);
  const promises = [];

  for (let i = 0; i < messages.length; i++) {
    promises.push(removeMessage(messages[i] as HTMLElement));
  }

  await Promise.all(promises);
}

async function removeMessage(messageElement: HTMLElement) {
  await animate(messageElement, "fadeOutUp");
  messageElement.remove();
}

function removeOverflowedMessages() {
  let firstMessage = messagesElement.firstElementChild;

  while (firstMessage !== null && elementOverflows(firstMessage)) {
    firstMessage.remove();
    firstMessage = messagesElement.firstElementChild;
  }
}

function elementOverflows(element: Element) {
  const { top, bottom, left, right } = element.getBoundingClientRect();

  return (top < 0 && bottom < 0) || (left < 0 && right < 0);
}
