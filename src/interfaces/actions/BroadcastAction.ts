import { Action } from "./Action";

export interface BroadcastAction extends Action {
  type: "broadcast";
  data: {
    message: string;
  }
}