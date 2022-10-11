import { EventType } from "../../enums/EventType";
import { UserEvent } from "./UserEvent";

export interface UserTimeout extends UserEvent {
  type: EventType.UserTimeout;
  data: {
    duration: number;
  };
}
