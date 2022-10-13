import { ChatEvent } from "../../../enums/ChatEvent";
import { UserEvent } from "./UserEvent";

export interface ChatMessageEvent extends UserEvent {
  type: ChatEvent.ChatMessage;
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
