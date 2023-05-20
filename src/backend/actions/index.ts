import { access, constants, readFile } from "fs/promises";
import { error, extendLogger, warning } from "../helpers/log";
import {
  getVip,
  hidrate,
  highlightMessage,
  karaokeTime,
  lightTheme,
  russianRoulette,
  stealVip,
  timeoutFriend,
} from "./redemption";

import { GlobalAction } from "../../interfaces/actions/global";
import { RedemptionAction } from "../../interfaces/actions/redemption";
import { RedemptionMessage } from "../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../enums/RedemptionType";
import { cwd } from "process";

type RedemptionHandler = (
  msg: RedemptionMessage
) => Promise<RedemptionAction | GlobalAction>;

const redemptionsConfigFilePath = `${cwd()}/config/redemptions.json`;
const namespace = `actions`;
const log = extendLogger(namespace);

let redemptionActions: Record<string, Array<RedemptionType>> = {};

async function reloadRedemptionActions() {
  try {
    await access(redemptionsConfigFilePath, constants.R_OK);
  } catch (e) {
    error(
      '[%s] Cannot access configuration file "%s"',
      namespace,
      redemptionsConfigFilePath
    );
    return;
  }

  const redemptionActionsConfig = await readFile(redemptionsConfigFilePath);

  try {
    redemptionActions = JSON.parse(redemptionActionsConfig.toString());
  } catch (e) {
    error(
      '[%s] Error parsing configuration file "%s"',
      namespace,
      redemptionsConfigFilePath
    );
  }
}

async function getRedemptionActions() {
  // eslint-disable-next-line no-magic-numbers
  if (Object.keys(redemptionActions).length === 0) {
    log("Loading redemption actions");
    await reloadRedemptionActions();
  }

  return redemptionActions;
}

function redemptionActionsByRewardId(rewardId: string): Array<RedemptionType> {
  return redemptionActions[rewardId] ?? [];
}

function redemptionHandlersFromRewardId(
  rewardId: string
): Array<RedemptionHandler> {
  const rewards = redemptionActionsByRewardId(rewardId);
  const handlers = new Array<RedemptionHandler>();

  // eslint-disable-next-line no-magic-numbers
  if (rewards.length === 0) {
    warning("[%s] Unhandled redemption %s", namespace, rewardId);

    return handlers;
  }

  for (let i = 0; i < rewards.length; i++) {
    const redemptionType = rewards[i];

    switch (redemptionType) {
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
        warning("[%s] Unknown redemption type %s", namespace, redemptionType);
        break;
    }
  }

  return handlers;
}

getRedemptionActions();

export {
  RedemptionHandler,
  reloadRedemptionActions,
  getRedemptionActions,
  redemptionActionsByRewardId,
  redemptionHandlersFromRewardId,
};
