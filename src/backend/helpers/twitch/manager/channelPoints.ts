import {
  HelixCreateCustomRewardData,
  UserIdResolvable,
} from "@twurple/api/lib";

import { getApiClient } from "./auth";

async function createReward(
  userId: UserIdResolvable,
  data: HelixCreateCustomRewardData
) {
  const apiClient = await getApiClient();

  await apiClient.channelPoints.createCustomReward(userId, data);
}

async function completeRewards(
  channel: UserIdResolvable,
  rewardId: string,
  redemptionIds: Array<string> | string
) {
  if (!Array.isArray(redemptionIds)) {
    redemptionIds = [redemptionIds];
  }

  const apiClient = await getApiClient();

  await apiClient.channelPoints.updateRedemptionStatusByIds(
    channel,
    rewardId,
    redemptionIds,
    "FULFILLED"
  );
}

async function cancelRewards(
  channel: UserIdResolvable,
  rewardId: string,
  redemptionIds: Array<string> | string
) {
  if (!Array.isArray(redemptionIds)) {
    redemptionIds = [redemptionIds];
  }

  const apiClient = await getApiClient();

  await apiClient.channelPoints.updateRedemptionStatusByIds(
    channel,
    rewardId,
    redemptionIds,
    "CANCELED"
  );
}

export { createReward, completeRewards, cancelRewards };
