import { Event } from "./Event";
import { EventType } from "../../enums/EventType";

export interface ChatMessageRemoveEvent extends Event {
  type: EventType.ChatMessageRemove;
  data: {
    messageId: string;
  };
}
