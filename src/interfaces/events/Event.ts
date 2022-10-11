import { EventType } from "../../enums/EventType";

export interface Event {
  type: EventType;
  channelId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}
