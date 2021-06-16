const environment = process.env.NODE_ENV;
const isDevelopment = environment === "development";
const isProduction = environment === "production";

export {
  environment,
  isDevelopment,
  isProduction
};