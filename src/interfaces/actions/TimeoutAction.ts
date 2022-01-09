import { Action } from "./Action";
import { ActionType } from "../../enums/ActionType";

export interface TimeoutAction extends Action {
  type: ActionType.Timeout;
  data: {
    username: string;
    time: number;
    reason?: string;
  };
}
