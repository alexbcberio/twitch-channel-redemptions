import { ChatEvent } from "../../../enums/ChatEvent";
import { UserEvent } from "./UserEvent";

export interface UserBan extends UserEvent {
  type: ChatEvent.UserBan;
  data: null;
}
