import { BaseChatEvent } from "./BaseChatEvent";
import { ChatEvent } from "../../../enums/ChatEvent";

export interface ChatMessageRemoveEvent extends BaseChatEvent {
  type: ChatEvent.ChatMessageRemove;
  data: {
    messageId: string;
  };
}
