import { changeWindowsColorTheme, isWindows } from "./helpers";
import { isProduction, msText } from "../../helpers/util";

import { ColorTheme } from "./types";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { extendLogger } from "../../helpers/log";
import { messages } from "../../../localization";

const minEventDuration = 10;

const namespace = "PubSub:LightTheme";
const log = extendLogger(namespace);

const lightThemeMessages = messages.pubSubClient.actions.lightTheme;

let restoreAt = 0;
let restoreTimeout: NodeJS.Timeout | null;

function calculateEventDurationMs(rewardCost: number): number {
  const reduceBase = 200;
  const ms = 1e3;

  const eventDuration = Math.max(minEventDuration, rewardCost - reduceBase);

  return eventDuration * ms;
}

async function lightTheme(msg: RedemptionMessage): Promise<RedemptionMessage> {
  if (!isWindows) {
    throw new Error("Only available on Windows platform");
  }

  const colorTheme: ColorTheme = "light";

  if (isProduction) {
    await changeWindowsColorTheme(colorTheme);
  } else {
    log("Light Theme not changed to %s (not production)", colorTheme);
  }

  const eventDuration = calculateEventDurationMs(msg.rewardCost);

  if (restoreTimeout) {
    clearTimeout(restoreTimeout);

    msg.message = lightThemeMessages.messageTimeIncreased(
      msText(eventDuration)
    );
  } else {
    restoreAt = Date.now();

    msg.message = lightThemeMessages.message;
  }

  restoreAt += eventDuration;

  const timeoutTime = restoreAt - Date.now();

  msg.message += ` ${lightThemeMessages.cumulatedTime(msText(timeoutTime))}`;

  restoreTimeout = setTimeout(async () => {
    const colorTheme: ColorTheme = "dark";

    restoreTimeout = null;

    await changeWindowsColorTheme(colorTheme);
  }, timeoutTime);

  return msg;
}

export { lightTheme };
