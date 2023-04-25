import { Action } from "./Action";
import { ActionType } from "../../enums/ActionType";

export interface SayAction extends Action {
	type: ActionType.Say;
	data: {
		message: string;
	};
}
