import { EventType } from "../../enums/EventType";
import { UserEvent } from "./UserEvent";

export interface UserBan extends UserEvent {
  type: EventType.UserBan;
  data: null;
}
