import {
  ApiScope,
  ChatPubSubScope,
  SubscriptionTypeV1 as SubscriptionType,
} from "../../../enums/EventSub";

import { extendLogger } from "../log";

export * from "./manager";

const namespace = "Twitch";
const log = extendLogger(namespace);

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

export { log, namespace, availableSubscriptionTypesWithScope };
