import { Event } from "../../../../../interfaces/events/Event";
import { EventType } from "../../../../../enums/EventType";
import { UserTimeout } from "../../../../../interfaces/events/UserTimeout";
import { removeUserMessages } from "../common";

function isUserTimeoutMessage(action: Event): action is UserTimeout {
  return action.type === EventType.UserTimeout;
}

function handleUserTimeoutMessageAction(action: UserTimeout) {
  removeUserMessages(action.userId);
}

export { isUserTimeoutMessage, handleUserTimeoutMessageAction };
