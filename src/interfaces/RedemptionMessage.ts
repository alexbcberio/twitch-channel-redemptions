export interface RedemptionMessage {
  id: string;
  channelId: string;
  rewardId: string;
  rewardName: string;
  rewardImage: string;
  rewardCost: number;
  message?: string;
  userId: string;
  userDisplayName: string;
  backgroundColor: string;
}
