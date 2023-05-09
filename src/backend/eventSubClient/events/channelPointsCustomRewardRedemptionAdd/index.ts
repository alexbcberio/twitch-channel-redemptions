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
  karaokeTime,
  lightTheme,
  russianRoulette,
  stealVip,
  timeoutFriend,
} from "../../../actions/redemption";

import { GlobalAction } from "../../../../interfaces/actions/global";
import { RedemptionAction } from "../../../../interfaces/actions/redemption";
import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../../../enums/RedemptionType";
import { broadcast } from "../../../webserver";
import { constants } from "fs";
import { cwd } from "process";
import { isProduction } from "../../../helpers/util";

type RedemptionHandler = (
  msg: RedemptionMessage
) => Promise<RedemptionAction | GlobalAction>;

const configFilePath = `${cwd()}/config/redemptions.json`;
const namespace = `events:ChannelPointsCustomRewardRedemptionAdd`;
const log = extendLogger(namespace);

let redemptions: Record<string, Array<RedemptionType>> = {};

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

async function getRedemptions() {
  if (Object.keys(redemptions).length === 0) {
    log("Loading redemptions");
    await loadRedemptions();
  }

  return redemptions;
}

function noop(rewardId: string): void {
  log("Unhandled redemption %s", rewardId);
}

function redemptionsTypeFromRewardId(rewardId: string): Array<RedemptionType> {
  return redemptions[rewardId] ?? ["noop"];
}

function getRedemptionHandlersFromRewardId(
  rewardId: string
): Array<RedemptionHandler> {
  const rewards = redemptionsTypeFromRewardId(rewardId);
  const handlers = new Array<RedemptionHandler>();

  for (let i = 0; i < rewards.length; i++) {
    switch (rewards[i]) {
      case RedemptionType.GetVip:
        handlers.push(getVip);
        break;
      case RedemptionType.Hidrate:
        handlers.push(hidrate);
        break;
      case RedemptionType.HighlightMessage:
        handlers.push(highlightMessage);
        break;
      case RedemptionType.KaraokeTime:
        handlers.push(karaokeTime);
        break;
      case RedemptionType.LightTheme:
        handlers.push(lightTheme);
        break;
      case RedemptionType.RussianRoulette:
        handlers.push(russianRoulette);
        break;
      case RedemptionType.StealVip:
        handlers.push(stealVip);
        break;
      case RedemptionType.TimeoutFriend:
        handlers.push(timeoutFriend);
        break;
      default:
        noop(rewardId);
        break;
    }
  }

  return handlers;
}

function keepInQueue(rewardId: string): boolean {
  if (
    redemptionsTypeFromRewardId(rewardId).includes(RedemptionType.KaraokeTime)
  ) {
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

  const rewardsType = redemptionsTypeFromRewardId(reward.id);
  const redemptionHandlers = getRedemptionHandlersFromRewardId(reward.id);

  const clientActions = new Array<RedemptionAction | GlobalAction>();

  for (let i = 0; i < rewardsType.length; i++) {
    const rewardType = rewardsType[i];
    const redemptionHandler = redemptionHandlers[i];

    const msg: RedemptionMessage = {
      id: event.id,
      channelId: event.broadcaster_user_id,
      rewardId: reward.id,
      rewardType,
      rewardName: reward.title,
      // eslint-disable-next-line no-magic-numbers
      rewardImage: reward.getImageUrl(4),
      rewardCost: reward.cost,
      message: event.user_input,
      userId: event.user_id,
      userDisplayName: event.user_name,
      backgroundColor: reward.backgroundColor,
    };

    try {
      const handledMessage = await redemptionHandler(msg);

      clientActions.push(handledMessage);
    } catch (e) {
      if (e instanceof Error) {
        error("[%s] %s", namespace, e.message);
      }

      await cancelReward(event);

      return;
    }
  }

  broadcast(JSON.stringify({ events: clientActions }));

  if (isProduction) {
    await completeReward(event);
  } else {
    await cancelReward(event);
  }
}

export { handle, loadRedemptions as reloadRedemptions, getRedemptions };
