import { PubSubClient, PubSubRedemptionMessage } from "@twurple/pubsub";
import {
  cancelRewards,
  completeRewards,
  getAuthProvider,
} from "../helpers/twitch";
import { error, extendLogger, info } from "../helpers/log";

import { RedemptionIds } from "../../enums/Redemptions";
import { RedemptionMessage } from "../../interfaces/RedemptionMessage";
import { UserIdResolvable } from "@twurple/api";
import { broadcast } from "../webserver";
import { getVip } from "./actions/getVip";
import { hidrate } from "./actions/hidrate";
import { highlightMessage } from "./actions/highlightMessage";
import { isProduction } from "../helpers/util";
import { lightTheme } from "./actions/lightTheme";
import { rawDataSymbol } from "@twurple/common";
import { russianRoulette } from "./actions/russianRoulette";
import { stealVip } from "./actions/stealVip";
import { timeoutFriend } from "./actions/timeoutFriend";

const namespace = "PubSub";
const log = extendLogger(namespace);

type RedemptionHandler = (msg: RedemptionMessage) => Promise<RedemptionMessage>;

function getRedemptionHandlerFromRewardId(rewardId: string): RedemptionHandler {
  const noop = (message: RedemptionMessage): Promise<RedemptionMessage> => {
    log("Unhandled redemption %s", rewardId);
    return Promise.resolve(message);
  };

  switch (rewardId) {
    case RedemptionIds.GetVip:
      return getVip;
    case RedemptionIds.Hidrate:
      return hidrate;
    case RedemptionIds.HighlightMessage:
      return highlightMessage;
    case RedemptionIds.LightTheme2m:
    case RedemptionIds.LightTheme5m:
      return lightTheme;
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

function keepInQueue(rewardId: string): boolean {
  const keepInQueueRewards = [RedemptionIds.KaraokeTime];

  // @ts-expect-error String is not assignable to... but all keys are strings
  if (keepInQueueRewards.includes(rewardId)) {
    return true;
  }

  return false;
}

async function cancelReward(message: PubSubRedemptionMessage): Promise<void> {
  if (!message.rewardIsQueued) {
    return;
  }

  if (keepInQueue(message.rewardId)) {
    log("Reward kept in queue due to config");

    return;
  }

  try {
    await cancelRewards(message.channelId, message.rewardId, message.id);
    log("Reward removed from queue (canceled)");
  } catch (e) {
    if (e instanceof Error) {
      error("[%s] %s", namespace, e.message);
    }
  }
}

async function completeReward(message: PubSubRedemptionMessage): Promise<void> {
  if (!message.rewardIsQueued) {
    return;
  }

  if (keepInQueue(message.rewardId)) {
    log("Reward kept in queue due to config");

    return;
  }

  try {
    await completeRewards(message.channelId, message.rewardId, message.id);
    log("Reward removed from queue (completed)");
  } catch (e) {
    if (e instanceof Error) {
      error("[%s] %s", namespace, e.message);
    }
  }
}

function rewardNameFromRewardId(rewardId: string): string {
  const rewardEnumValues = Object.values(RedemptionIds);
  // @ts-expect-error String is not assignable to... but all keys are strings
  const rewardIdValueIndex = rewardEnumValues.indexOf(rewardId);
  const rewardName = Object.keys(RedemptionIds)[rewardIdValueIndex];

  return rewardName;
}

async function onRedemption(message: PubSubRedemptionMessage) {
  log(
    'Reward: "%s" (%s) redeemed by %s',
    message.rewardTitle,
    message.rewardId,
    message.userDisplayName
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
    rewardCost: message.rewardCost,
    message: message.message,
    userId: message.userId,
    userDisplayName: message.userDisplayName,
    backgroundColor: raw.data.redemption.reward.background_color,
  };

  let handledMessage: RedemptionMessage;

  const redemptionHandler = getRedemptionHandlerFromRewardId(msg.rewardId);

  try {
    handledMessage = {
      ...(await redemptionHandler(msg)),
      rewardId: rewardNameFromRewardId(message.rewardId),
    };
  } catch (e) {
    if (e instanceof Error) {
      error("[%s] %s", namespace, e.message);
    }

    await cancelReward(message);

    return;
  }

  broadcast(JSON.stringify(handledMessage));

  if (isProduction) {
    await completeReward(message);
  } else {
    await cancelReward(message);
  }
}

async function registerUserListener(user: UserIdResolvable) {
  const pubSubClient = new PubSubClient();
  const userId = await pubSubClient.registerUserListener(
    await getAuthProvider(),
    user
  );

  await pubSubClient.onRedemption(userId, onRedemption);

  info("[%s] Connected & registered", namespace);
}

export { registerUserListener };
