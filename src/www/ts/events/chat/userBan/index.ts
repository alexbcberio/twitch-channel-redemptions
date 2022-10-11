import { Event } from "../../../../../interfaces/events/Event";
import { EventType } from "../../../../../enums/EventType";
import { UserBan } from "../../../../../interfaces/events/UserBan";
import { removeUserMessages } from "../common";

function isUserBanMessage(action: Event): action is UserBan {
  return action.type === EventType.UserBan;
}

function handleUserBanMessageAction(action: UserBan) {
  removeUserMessages(action.userId);
}

export { isUserBanMessage, handleUserBanMessageAction };
