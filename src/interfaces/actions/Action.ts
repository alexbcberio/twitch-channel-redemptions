export interface Action {
  type: string;
  channelId: string;
  userId: string;
  scheduledAt?: number;
  data: any;
}