import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import {
  ApiClient,
  HelixCreateCustomRewardData,
  UserIdResolvable,
} from "@twurple/api";
import {
  ApiScope,
  ChatPubSubScope,
  SubscriptionTypeV1 as SubscriptionType,
} from "../../enums/EventSub";
import { error, extendLogger } from "./log";
import { getTokenData, saveTokenData } from "./tokenData";

import { ClientCredentials } from "../../interfaces/ClientCredentials";

const namespace = "Twitch";
const log = extendLogger(namespace);

let refreshAuthProvider: RefreshingAuthProvider;
let apiClient: ApiClient | null = null;

function getClientCredentials(): ClientCredentials {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    error(
      "[%s] Missing environment parameters TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET",
      namespace
    );

    const exitCode = 1;

    process.exit(exitCode);
  }

  return {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
  };
}

async function onRefresh(refreshData: AccessToken): Promise<void> {
  log("Tokens refreshed");

  await saveTokenData(refreshData);
}

async function getAuthProvider(): Promise<RefreshingAuthProvider> {
  const tokenData = await getTokenData();

  if (!refreshAuthProvider) {
    const credentials = getClientCredentials();

    log("Creating RefreshingAuthProvider instance");
    refreshAuthProvider = new RefreshingAuthProvider(
      {
        clientId: credentials.clientId,
        clientSecret: credentials.clientSecret,
        onRefresh,
      },
      tokenData
    );
  }

  return refreshAuthProvider;
}

async function getApiClient(): Promise<ApiClient> {
  const authProvider = await getAuthProvider();

  if (apiClient === null) {
    log("Creating ApiClient instance");
    apiClient = new ApiClient({ authProvider });
  }

  return apiClient;
}

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

function availableSubscriptionTypesWithScope(
  scopes: Array<ApiScope | ChatPubSubScope>
) {
  const subscriptionTypes = Array<SubscriptionType>(
    SubscriptionType.ChannelFollow,
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

export {
  getAuthProvider,
  getApiClient,
  getUsernameFromId,
  getUserIdFromUsername,
  completeRewards,
  cancelRewards,
  createReward,
  availableSubscriptionTypesWithScope,
};
