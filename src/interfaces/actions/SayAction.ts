import { Action } from "./Action";

export interface SayAction extends Action {
  type: "say";
  data: {
    message: "string";
  }
}