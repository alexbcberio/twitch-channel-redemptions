import { Action } from "./Action";
import { ActionType } from "../../enums/ActionType";

export interface BroadcastAction extends Action {
  type: ActionType.Broadcast;
  data: {
    message: string;
  };
}
