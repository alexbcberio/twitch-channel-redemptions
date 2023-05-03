import {
  ApiScope,
  ChatPubSubScope,
  SubscriptionTypeV1 as SubscriptionType,
} from "../../../enums/EventSub";

import { HelixUser } from "@twurple/api";
import { extendLogger } from "../log";
import { getApiClient } from "./manager/auth";

export * from "./manager";

const namespace = "Twitch";
const log = extendLogger(namespace);

let streamerUser: HelixUser | null = null;

async function getUsernameFromId(userId: number): Promise<string | null> {
  const apiClient = await getApiClient();
  const user = await apiClient.users.getUserById(userId);

  if (!user) {
    return null;
  }

  return user.displayName;
}

async function getUserIdFromUsername(username: string): Promise<string | null> {
  const apiClient = await getApiClient();
  const user = await apiClient.users.getUserByName(username);

  if (!user) {
    return null;
  }

  return user.id;
}

function availableSubscriptionTypesWithScope(
  scopes: Array<ApiScope | ChatPubSubScope>
) {
  const subscriptionTypes = Array<SubscriptionType>(
    SubscriptionType.ChannelRaid,
    SubscriptionType.StreamOnline,
    SubscriptionType.StreamOffline
  );

  for (let i = 0; i < scopes.length; i++) {
    switch (scopes[i]) {
      case ApiScope.ChannelReadSubscriptions:
        subscriptionTypes.push(
          SubscriptionType.ChannelSubscribe,
          SubscriptionType.ChannelSubscriptionEnd,
          SubscriptionType.ChannelSubscriptionGift,
          SubscriptionType.ChannelSubscriptionMessage
        );
        break;
      case ApiScope.BitsRead:
        subscriptionTypes.push(SubscriptionType.ChannelCheer);
        break;
      case ChatPubSubScope.ChannelModerate:
        subscriptionTypes.push(
          SubscriptionType.ChannelBan,
          SubscriptionType.ChannelUnban
        );
        break;
      case ApiScope.ModerationRead:
        subscriptionTypes.push(
          SubscriptionType.ChannelModeratorAdd,
          SubscriptionType.ChannelModeratorRemove
        );
        break;
      case ApiScope.UserReadFollows:
        subscriptionTypes.push(SubscriptionType.ChannelFollow);
        break;
      case ApiScope.ChannelReadRedemptions:
      case ApiScope.ChannelManageRedemptions:
        subscriptionTypes.push(
          SubscriptionType.ChannelChannelPointsCustomRewardAdd,
          SubscriptionType.ChannelChannelPointsCustomRewardUpdate,
          SubscriptionType.ChannelChannelPointsCustomRewardRemove,
          SubscriptionType.ChannelChannelPointsCustomRewardRedemptionAdd,
          SubscriptionType.ChannelChannelPointsCustomRewardRedemptionUpdate
        );
        break;
      case ApiScope.ChannelReadPolls:
      case ApiScope.ChannelManagePolls:
        subscriptionTypes.push(
          SubscriptionType.ChannelPollBegin,
          SubscriptionType.ChannelPollProgress,
          SubscriptionType.ChannelPollEnd
        );
        break;
      case ApiScope.ChannelReadPredictions:
      case ApiScope.ChannelManagePredictions:
        subscriptionTypes.push(
          SubscriptionType.ChannelPredictionBegin,
          SubscriptionType.ChannelPredictionProgress,
          SubscriptionType.ChannelPredictionLock,
          SubscriptionType.ChannelPredictionEnd
        );
        break;
      case ApiScope.ChannelReadHypeTrain:
        subscriptionTypes.push(
          SubscriptionType.ChannelHypeTrainBegin,
          SubscriptionType.ChannelHypeTrainProgress,
          SubscriptionType.ChannelHypeTrainEnd
        );
        break;
      case ApiScope.ChannelReadGoals:
        subscriptionTypes.push(
          SubscriptionType.ChannelGoalBegin,
          SubscriptionType.ChannelGoalProgress,
          SubscriptionType.ChannelGoalEnd
        );
        break;
      default:
    }
  }

  // remove duplicated events
  return [...new Set(subscriptionTypes)];
}

async function getStreamerUser() {
  if (streamerUser === null) {
    const apiClient = await getApiClient();

    const username = process.env.TWITCH_CHANNEL_NAME;

    if (typeof username !== "string") {
      throw new Error(
        "TWITCH_CHANNEL_NAME environment variable not found in .env"
      );
    }

    const user = await apiClient.users.getUserByName(username);

    if (user === null) {
      throw new Error(`User ${username} does not exist`);
    }

    // eslint-disable-next-line require-atomic-updates
    streamerUser = user;
  }

  return streamerUser;
}

export {
  log,
  namespace,
  getUsernameFromId,
  getUserIdFromUsername,
  availableSubscriptionTypesWithScope,
  getStreamerUser,
};
