import {
  changeVsCodeColorTheme,
  changeWindowsColorTheme,
  existsVsCodeSettings,
  isWindows,
} from "./helpers";
import { isProduction, msText } from "../../../helpers/util";

import { ColorTheme } from "./types";
import { LOG_PREFIX } from "../..";
import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { messages } from "../../../../localization";

const vsCodeLightTheme = "Min Light";
const vsCodeDarkTheme = "Min Dark";

const minEventDuration = 10;

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
    if (await existsVsCodeSettings()) {
      await changeVsCodeColorTheme(colorTheme);
    }

    await changeWindowsColorTheme(colorTheme);
  } else {
    console.log(
      `${LOG_PREFIX}Light Theme not changed to ${colorTheme} (not production)`
    );
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

    await Promise.all([
      changeVsCodeColorTheme(colorTheme),
      changeWindowsColorTheme(colorTheme),
    ]);
  }, timeoutTime);

  return msg;
}

export { lightTheme, vsCodeDarkTheme, vsCodeLightTheme };
