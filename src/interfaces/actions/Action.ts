import { ActionType } from "../../enums/ActionType";

export interface Action {
  type: ActionType;
  channelId: string;
  userId: string;
  scheduledAt?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}
