import { ChatEvent } from "../../../enums/ChatEvent";
import { UserEvent } from "./UserEvent";

export interface UserTimeout extends UserEvent {
  type: ChatEvent.UserTimeout;
  data: {
    duration: number;
  };
}
