import { Action } from "./Action";

export interface TimeoutAction extends Action {
  type: "timeout";
  data: {
    username: string;
    time: number;
    reason?: string;
  }
}