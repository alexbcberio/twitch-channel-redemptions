import { info } from "../../../helpers/log";
import { namespace } from "../..";
import { start } from "../../../helpers/miniDb";

export function onConnect(): Promise<void> {
  info("[%s] Connected", namespace);

  start();

  return Promise.resolve();
}
