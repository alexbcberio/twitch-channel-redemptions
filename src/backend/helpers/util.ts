import { Environment } from "../../enums/Environment";
import { messages } from "../../localization";

const environment = process.env.NODE_ENV;
const isDevelopment = environment === Environment.development;
const isProduction = environment === Environment.production;

const utilMessages = messages.helpers.util;

function msText(ms: number): string {
  let amountTime: number;
  let amountUnit: Array<string>;

  const second = 1e3;
  const minute = 60e3;

  if (ms >= minute) {
    amountTime = ms / minute;
    amountUnit = utilMessages.msText.minute;
  } else {
    amountTime = ms / second;
    amountUnit = utilMessages.msText.minute;
  }

  const decimalPrecision = 1e2;
  const roundedAmountTime =
    Math.round(amountTime * decimalPrecision) / decimalPrecision;
  // eslint-disable-next-line no-magic-numbers
  const unitPluralized = roundedAmountTime > 1 ? amountUnit[0] : amountUnit[1];

  return `${roundedAmountTime} ${unitPluralized}`;
}

export { msText, isDevelopment, isProduction };
