import { BaseChatEvent } from "./BaseChatEvent";

export interface UserEvent extends BaseChatEvent {
  userId: string;
}
