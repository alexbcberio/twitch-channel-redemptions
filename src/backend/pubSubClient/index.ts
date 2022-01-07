import { PubSubClient, PubSubRedemptionMessage } from "@twurple/pubsub";
import {
  cancelRewards,
  completeRewards,
  getAuthProvider,
} from "../helpers/twitch";

import { RedemptionIds } from "../../enums/Redemptions";
import { RedemptionMessage } from "../../interfaces/RedemptionMessage";
import { UserIdResolvable } from "@twurple/api";
import { broadcast } from "../helpers/webServer";
import { getVip } from "./actions/getVip";
import { hidrate } from "./actions/hidrate";
import { highlightMessage } from "./actions/highlightMessage";
import { isProduction } from "../helpers/util";
import { rawDataSymbol } from "@twurple/common";
import { russianRoulette } from "./actions/russianRoulette";
import { stealVip } from "./actions/stealVip";
import { timeoutFriend } from "./actions/timeoutFriend";

const LOG_PREFIX = "[PubSub] ";

type RedemptionHandler = (
  msg: RedemptionMessage
) => Promise<RedemptionMessage | undefined>;

function getRedemptionHandlerFromRewardId(rewardId: string): RedemptionHandler {
  const noop = (message: RedemptionMessage): Promise<RedemptionMessage> => {
    console.log(`${LOG_PREFIX}Unhandled redemption ${rewardId}`);
    return Promise.resolve(message);
  };

  switch (rewardId) {
    case RedemptionIds.GetVip:
      return getVip;
    case RedemptionIds.Hidrate:
      return hidrate;
    case RedemptionIds.HighlightMessage:
      return highlightMessage;
    case RedemptionIds.RussianRoulette:
      return russianRoulette;
    case RedemptionIds.StealVip:
      return stealVip;
    case RedemptionIds.TimeoutFriend:
      return timeoutFriend;
    default:
      return noop;
  }
}

async function onRedemption(message: PubSubRedemptionMessage) {
  console.log(
    `${LOG_PREFIX}Reward: "${message.rewardTitle}" (${message.rewardId}) redeemed by ${message.userDisplayName}`
  );

  const raw = message[rawDataSymbol];

  const msg: RedemptionMessage = {
    id: message.id,
    channelId: message.channelId,
    rewardId: message.rewardId,
    rewardName: message.rewardTitle,
    rewardImage: message.rewardImage
      ? message.rewardImage.url_4x
      : "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png",
    message: message.message,
    userId: message.userId,
    userDisplayName: message.userDisplayName,
    backgroundColor: raw.data.redemption.reward.background_color,
  };

  let handledMessage: RedemptionMessage | undefined;

  const redemptionHandler = getRedemptionHandlerFromRewardId(msg.rewardId);

  try {
    handledMessage = await redemptionHandler(msg);
  } catch (e) {
    if (e instanceof Error) {
      console.error(`${LOG_PREFIX}${e.message}`);
    }
  }

  if (typeof handledMessage !== "undefined") {
    const rewardEnumValues = Object.values(RedemptionIds);
    const rewardIdValueIndex = rewardEnumValues.indexOf(
      // @ts-expect-error String is not assignable to... but all keys are strings
      handledMessage.rewardId
    );
    const rewardName = Object.keys(RedemptionIds)[rewardIdValueIndex];

    handledMessage.rewardId = rewardName;

    broadcast(JSON.stringify(handledMessage));
  }

  // TODO: improve this check
  const keepInQueueRewards = [RedemptionIds.KaraokeTime];

  // @ts-expect-error String is not assignable to... but all keys are strings
  if (keepInQueueRewards.includes(message.rewardId)) {
    console.log(`${LOG_PREFIX}Reward kept in queue due to config`);
    return;
  }

  const completeOrCancelReward =
    handledMessage && isProduction ? completeRewards : cancelRewards;

  if (message.rewardIsQueued) {
    try {
      await completeOrCancelReward(
        message.channelId,
        message.rewardId,
        message.id
      );
      console.log(
        `${LOG_PREFIX}Reward removed from queue (completed or canceled)`
      );
    } catch (e) {
      if (e instanceof Error) {
        console.log(`${LOG_PREFIX}${e.message}`);
      }
    }
  }
}

async function registerUserListener(user: UserIdResolvable) {
  const pubSubClient = new PubSubClient();
  const userId = await pubSubClient.registerUserListener(
    await getAuthProvider(),
    user
  );

  await pubSubClient.onRedemption(userId, onRedemption);

  console.log(`${LOG_PREFIX}Connected & registered`);
}

export { registerUserListener, LOG_PREFIX };
