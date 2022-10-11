import { EventType } from "../../enums/EventType";
import { UserEvent } from "./UserEvent";

export interface ChatMessageEvent extends UserEvent {
  type: EventType.ChatMessage;
  data: {
    user: {
      name: string;
      color: string;
      isMod: boolean;
    };
    message: {
      text: string;
      id: string;
    };
  };
}
