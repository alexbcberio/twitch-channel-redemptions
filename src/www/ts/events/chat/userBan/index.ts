import { BaseChatEvent } from "../../../../../interfaces/events/chat/BaseChatEvent";
import { ChatEvent } from "../../../../../enums/ChatEvent";
import { UserBan } from "../../../../../interfaces/events/chat/UserBan";
import { removeUserMessages } from "../common";

function isUserBanMessage(action: BaseChatEvent): action is UserBan {
  return action.type === ChatEvent.UserBan;
}

function handleUserBanMessageAction(action: UserBan) {
  removeUserMessages(action.userId);
}

export { isUserBanMessage, handleUserBanMessageAction };
