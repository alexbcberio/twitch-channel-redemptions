import { RedemptionType } from "../enums/RedemptionType";

export interface RedemptionMessage {
  id: string;
  channelId: string;
  rewardId: string;
  rewardType: RedemptionType;
  rewardName: string;
  rewardImage: string;
  rewardCost: number;
  message?: string;
  userId: string;
  userDisplayName: string;
  backgroundColor: string;
}
