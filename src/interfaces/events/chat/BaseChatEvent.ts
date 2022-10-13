import { ChatEvent } from "../../../enums/ChatEvent";

export interface BaseChatEvent {
  type: ChatEvent;
  channelId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}
