import { PubSubClient, PubSubRedemptionMessage } from "@twurple/pubsub";
import { access, readFile } from "fs/promises";
import {
  cancelRewards,
  completeRewards,
  getAuthProvider,
} from "../helpers/twitch";
import { error, extendLogger, info } from "../helpers/log";
import {
  getVip,
  hidrate,
  highlightMessage,
  lightTheme,
  russianRoulette,
  stealVip,
  timeoutFriend,
} from "./actions";

import { RedemptionMessage } from "../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../enums/RedemptionType";
import { UserIdResolvable } from "@twurple/api";
import { broadcast } from "../webserver";
import { constants } from "fs";
import { cwd } from "process";
import { isProduction } from "../helpers/util";
import { rawDataSymbol } from "@twurple/common";

const namespace = "PubSub";
const log = extendLogger(namespace);

type RedemptionHandler = (msg: RedemptionMessage) => Promise<RedemptionMessage>;

const configFilePath = `${cwd()}/config/redemptions.json`;

let redemptions: Record<string, RedemptionType> = {};

async function loadRedemptions() {
  try {
    await access(configFilePath, constants.R_OK);
  } catch (e) {
    error(
      '[%s] Cannot access configuration file "%s"',
      namespace,
      configFilePath
    );
    return;
  }

  const redemptionsConfig = await readFile(configFilePath);

  try {
    redemptions = JSON.parse(redemptionsConfig.toString());
  } catch (e) {
    error(
      '[%s] Error parsing configuration file "%s"',
      namespace,
      configFilePath
    );
  }
}

function noop(message: RedemptionMessage): Promise<RedemptionMessage> {
  log("Unhandled redemption %s", message.rewardId);
  return Promise.resolve(message);
}

function getRedemptionHandlerFromRewardId(rewardId: string): RedemptionHandler {
  switch (redemptions[rewardId]) {
    case RedemptionType.GetVip:
      return getVip;
    case RedemptionType.Hidrate:
      return hidrate;
    case RedemptionType.HighlightMessage:
      return highlightMessage;
    case RedemptionType.LightTheme:
      return lightTheme;
    case RedemptionType.RussianRoulette:
      return russianRoulette;
    case RedemptionType.StealVip:
      return stealVip;
    case RedemptionType.TimeoutFriend:
      return timeoutFriend;
    default:
      return noop;
  }
}

function keepInQueue(rewardId: string): boolean {
  if (redemptions[rewardId] === RedemptionType.KaraokeTime) {
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

function rewardTypeFromRewardId(rewardId: string): RedemptionType {
  return redemptions[rewardId];
}

async function onRedemption(message: PubSubRedemptionMessage) {
  // eslint-disable-next-line no-magic-numbers
  if (Object.keys(redemptions).length === 0) {
    log("Loading redemptions");
    await loadRedemptions();
  }

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
    rewardType: rewardTypeFromRewardId(message.rewardId),
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
    handledMessage = await redemptionHandler(msg);
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
