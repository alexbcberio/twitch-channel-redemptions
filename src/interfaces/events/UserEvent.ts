import { Event } from "./Event";

export interface UserEvent extends Event {
  userId: string;
}
