import { Action } from "./Action";
import { ActionType } from "../../../enums/ActionType";

export interface VipAction extends Action {
  type: ActionType.AddVip | ActionType.RemoveVip;
  data: undefined;
}
