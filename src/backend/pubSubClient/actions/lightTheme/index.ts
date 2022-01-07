import {
  changeVsCodeColorTheme,
  changeWindowsColorTheme,
  existsVsCodeSettings,
  isWindows,
} from "./helpers";

import { ColorTheme } from "./types";
import { LOG_PREFIX } from "../..";
import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { isProduction } from "../../../helpers/util";

const vsCodeLightTheme = "Min Light";
const vsCodeDarkTheme = "Min Dark";

const minEventDuration = 10;

let restoreAt = 0;
let restoreTimeout: NodeJS.Timeout | null;

function calculateEventDurationMs(rewardCost: number): number {
  const reduceBase = 200;
  const ms = 1e3;

  const eventDuration = Math.max(minEventDuration, rewardCost - reduceBase);

  return eventDuration * ms;
}

function msText(ms: number): string {
  let amountTime: number;
  let amountUnit: string;

  const second = 1e3;
  const minute = 60e3;

  if (ms >= minute) {
    amountTime = ms / minute;
    amountUnit = "minuto";
  } else {
    amountTime = ms / second;
    amountUnit = "segundo";
  }

  const decimalPrecision = 1e2;
  const roundedAmountTime =
    Math.round(amountTime * decimalPrecision) / decimalPrecision;
  // eslint-disable-next-line no-magic-numbers
  const pluralize = roundedAmountTime > 1 ? "s" : "";

  return `${roundedAmountTime} ${amountUnit}${pluralize}`;
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

    msg.message = `Aumentado el tiempo con tema claro por ${msText(
      eventDuration
    )}`;
  } else {
    restoreAt = Date.now();

    msg.message = `Disfruta de un dia iluminado`;
  }

  restoreAt += eventDuration;

  const timeoutTime = restoreAt - Date.now();

  msg.message += ` (tiempo acumulado ${msText(timeoutTime)})`;

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
