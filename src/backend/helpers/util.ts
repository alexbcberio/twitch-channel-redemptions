import { Environment } from "../../enums/Environment";

const environment = process.env.NODE_ENV;
const isDevelopment = environment === Environment.development;
const isProduction = environment === Environment.production;

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

export { msText, isDevelopment, isProduction };
