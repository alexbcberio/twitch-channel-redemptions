import { BaseChatEvent } from "../../../../../interfaces/events/chat/BaseChatEvent";
import { ChatEvent } from "../../../../../enums/ChatEvent";
import { UserTimeout } from "../../../../../interfaces/events/chat/UserTimeout";
import { removeUserMessages } from "../common";

function isUserTimeoutMessage(action: BaseChatEvent): action is UserTimeout {
  return action.type === ChatEvent.UserTimeout;
}

function handleUserTimeoutMessageAction(action: UserTimeout) {
  removeUserMessages(action.userId);
}

export { isUserTimeoutMessage, handleUserTimeoutMessageAction };
