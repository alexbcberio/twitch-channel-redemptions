import debug, { Debugger } from "debug";

enum Color {
  Red = "1",
  Green = "2",
  Yellow = "3",
  Blue = "4",
}

const packageName = process.env.npm_package_name ?? "";

const main = debug(packageName);

const error = main.extend("error");
error.enabled = true;
error.color = Color.Red;

const warning = main.extend("warning");
warning.enabled = true;
warning.color = Color.Yellow;

const info = main.extend("info");
info.enabled = true;
info.color = Color.Blue;

const success = main.extend("success");
success.enabled = true;
success.color = Color.Green;

function extendLogger(name: string): Debugger {
  return main.extend(name);
}

export { main, error, warning, info, success, extendLogger };
