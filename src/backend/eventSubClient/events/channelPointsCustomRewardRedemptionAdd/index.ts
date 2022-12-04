import {
  ChannelPointsCustomRewardRedemptionAddEvent,
  NotificationMessage,
} from "../../../../interfaces/events/eventSub";
import { access, readFile } from "fs/promises";
import {
  cancelRewards,
  completeRewards,
  getApiClient,
} from "../../../helpers/twitch";
import { error, extendLogger } from "../../../helpers/log";
import {
  getVip,
  hidrate,
  highlightMessage,
  lightTheme,
  russianRoulette,
  stealVip,
  timeoutFriend,
} from "./actions";

import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../../../enums/RedemptionType";
import { broadcast } from "../../../webserver";
import { constants } from "fs";
import { cwd } from "process";
import { isProduction } from "../../../helpers/util";

type RedemptionHandler = (msg: RedemptionMessage) => Promise<RedemptionMessage>;

const configFilePath = `${cwd()}/config/redemptions.json`;
const namespace = `events:ChannelPointsCustomRewardRedemptionAdd`;
const log = extendLogger(namespace);

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

function updatableReward(
  rewardEvent: ChannelPointsCustomRewardRedemptionAddEvent
): boolean {
  if (
    rewardEvent.status === "unfulfilled" &&
    keepInQueue(rewardEvent.reward.id)
  ) {
    log("Reward kept in queue due to config");

    return false;
  }

  return true;
}

async function cancelReward(
  rewardEvent: ChannelPointsCustomRewardRedemptionAddEvent
): Promise<void> {
  if (!updatableReward(rewardEvent)) {
    return;
  }

  try {
    await cancelRewards(
      rewardEvent.broadcaster_user_id,
      rewardEvent.reward.id,
      rewardEvent.id
    );
    log("Reward removed from queue (canceled)");
  } catch (e) {
    if (e instanceof Error) {
      error("[%s] %s", namespace, e.message);
    }
  }
}

async function completeReward(
  rewardEvent: ChannelPointsCustomRewardRedemptionAddEvent
): Promise<void> {
  if (!updatableReward(rewardEvent)) {
    return;
  }

  try {
    await completeRewards(
      rewardEvent.broadcaster_user_id,
      rewardEvent.reward.id,
      rewardEvent.id
    );
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

async function handle(
  notification: NotificationMessage<ChannelPointsCustomRewardRedemptionAddEvent>
) {
  // eslint-disable-next-line no-magic-numbers
  if (Object.keys(redemptions).length === 0) {
    log("Loading redemptions");
    await loadRedemptions();
  }

  const apiClient = await getApiClient();
  const { event } = notification.payload;
  const rewardId = event.reward.id;
  const reward = await apiClient.channelPoints.getCustomRewardById(
    event.broadcaster_user_id,
    rewardId
  );

  log(
    'Reward: "%s" (%s) redeemed by %s',
    event.reward.title,
    event.reward.id,
    event.user_login
  );

  if (!reward) {
    error(
      '[%s] Internal error, could not get "%d" reward details.',
      namespace,
      rewardId
    );
    return;
  }

  const msg: RedemptionMessage = {
    id: event.id,
    channelId: event.broadcaster_user_id,
    rewardId: reward.id,
    rewardType: rewardTypeFromRewardId(reward.id),
    rewardName: reward.title,
    // eslint-disable-next-line no-magic-numbers
    rewardImage: reward.getImageUrl(4),
    rewardCost: reward.cost,
    message: event.user_input,
    userId: event.user_id,
    userDisplayName: event.user_name,
    backgroundColor: reward.backgroundColor,
  };

  let handledMessage: RedemptionMessage;

  const redemptionHandler = getRedemptionHandlerFromRewardId(msg.rewardId);

  try {
    handledMessage = await redemptionHandler(msg);
  } catch (e) {
    if (e instanceof Error) {
      error("[%s] %s", namespace, e.message);
    }

    await cancelReward(event);

    return;
  }

  broadcast(JSON.stringify(handledMessage));

  if (isProduction) {
    await completeReward(event);
  } else {
    await cancelReward(event);
  }
}

export { handle };