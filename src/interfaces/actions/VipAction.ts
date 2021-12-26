import { Action } from "./Action";

export interface VipAction extends Action {
  type: "addVip" | "removeVip";
  data: undefined;
}