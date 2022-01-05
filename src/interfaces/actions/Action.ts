import { ActionType } from "../../enums/ActionType";

export interface Action {
	type: ActionType;
	channelId: string;
	userId: string;
	scheduledAt?: number;
	data: any;
}
