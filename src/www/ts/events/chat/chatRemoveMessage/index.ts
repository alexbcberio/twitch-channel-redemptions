import { ChatMessageRemoveEvent } from "../../../../../interfaces/events/ChatMessageRemoveEvent";
import { Event } from "../../../../../interfaces/events/Event";
import { EventType } from "../../../../../enums/EventType";
import { removeMessage } from "../common";

function isChatRemoveMessage(action: Event): action is ChatMessageRemoveEvent {
  return action.type === EventType.ChatMessageRemove;
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

export { isChatRemoveMessage, handleChatRemoveMessageAction };
