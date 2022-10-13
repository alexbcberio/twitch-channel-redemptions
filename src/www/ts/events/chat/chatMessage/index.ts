import { BaseChatEvent } from "../../../../../interfaces/events/chat/BaseChatEvent";
import { ChatEvent } from "../../../../../enums/ChatEvent";
import { ChatMessageEvent } from "../../../../../interfaces/events/chat/ChatMessageEvent";
import { animate } from "../../../helpers/animate.css";
import { removeMessage } from "../common";

const REMOVE_MESSAGE_AFTER_MS = 2 * 60e3;

let messagesElement: HTMLElement;

function isChatMessage(action: BaseChatEvent): action is ChatMessageEvent {
  return action.type === ChatEvent.ChatMessage;
}

function handleChatMessageAction(action: ChatMessageEvent) {
  if (messagesElement === undefined) {
    try {
      initMessagesElement();
    } catch (e) {
      console.error(e);
      return;
    }
  }

  const message = createUserMessage(action);
  messagesElement.appendChild(message);

  animate(message, "fadeInUp");

  removeOverflowedMessages();
}

function initMessagesElement() {
  const messagesSelector = "#messages";
  const element = document.querySelector<HTMLElement>(messagesSelector);

  if (element === null) {
    throw new Error(
      `Messages container not found, querying "${messagesSelector}"`
    );
  }

  messagesElement = element;
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

export { isChatMessage, handleChatMessageAction };
