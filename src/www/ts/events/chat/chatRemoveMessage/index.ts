import { BaseChatEvent } from "../../../../../interfaces/events/chat/BaseChatEvent";
import { ChatEvent } from "../../../../../enums/ChatEvent";
import { ChatMessageRemoveEvent } from "../../../../../interfaces/events/chat/ChatMessageRemoveEvent";
import { removeMessage } from "../common";

function isChatRemoveMessage(
  action: BaseChatEvent
): action is ChatMessageRemoveEvent {
  return action.type === ChatEvent.ChatMessageRemove;
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
