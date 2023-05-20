import { access, constants, readFile, writeFile } from "fs/promises";
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

const saveRedemptionActionsTimeout = 100;
let queueSaveRedemptionActions: NodeJS.Timeout;

function emptyRedemptionActions() {
  // eslint-disable-next-line no-magic-numbers
  return Object.keys(redemptionActions).length === 0;
}

async function reloadRedemptionActions() {
  try {
    await access(redemptionsConfigFilePath, constants.R_OK);
  } catch (e) {
    error(
      '[%s] Missing read permissions on file "%s"',
      namespace,
      redemptionsConfigFilePath
    );
    return;
  }

  const firstLoad = emptyRedemptionActions();
  const redemptionActionsConfig = await readFile(redemptionsConfigFilePath);

  try {
    redemptionActions = JSON.parse(redemptionActionsConfig.toString());
  } catch (e) {
    error(
      '[%s] Error parsing redemption actions file "%s"',
      namespace,
      redemptionsConfigFilePath
    );
  }

  if (firstLoad) {
    log('Loaded redemption actions from file "%s"', redemptionsConfigFilePath);
  } else {
    log(
      'Reloaded redemption actions from file "%s"',
      redemptionsConfigFilePath
    );
  }
}

async function saveRedemptionActions() {
  try {
    await access(redemptionsConfigFilePath, constants.W_OK);
  } catch (e) {
    error(
      '[%s] Missing write permissions on file "%s"',
      namespace,
      redemptionsConfigFilePath
    );
    return;
  }

  try {
    await writeFile(
      redemptionsConfigFilePath,
      JSON.stringify(redemptionActions)
    );
  } catch (e) {
    error(
      '[%s] Error saving redemption actions into file "%s"',
      namespace,
      redemptionsConfigFilePath
    );
  }

  log('Saved redemption actions on file "%s"', redemptionsConfigFilePath);
}

function setRedemptionActions(
  rewardId: string,
  actions: Array<RedemptionType>
) {
  redemptionActions[rewardId] = actions;

  if (queueSaveRedemptionActions) {
    clearTimeout(queueSaveRedemptionActions);
  }

  queueSaveRedemptionActions = setTimeout(
    saveRedemptionActions,
    saveRedemptionActionsTimeout
  );
}

function getRedemptionActions(rewardId: string): Array<RedemptionType> {
  return redemptionActions[rewardId] ?? [];
}

function redemptionHandlersFromRewardId(
  rewardId: string
): Array<RedemptionHandler> {
  const rewards = getRedemptionActions(rewardId);
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

reloadRedemptionActions();

export {
  RedemptionHandler,
  reloadRedemptionActions,
  getRedemptionActions,
  setRedemptionActions,
  redemptionHandlersFromRewardId,
};
