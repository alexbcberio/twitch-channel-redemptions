import { Environment } from "../../enums/Environment";

const environment = process.env.NODE_ENV;
const isDevelopment = environment === Environment.development;
const isProduction = environment === Environment.production;

export {
  isDevelopment,
  isProduction
};