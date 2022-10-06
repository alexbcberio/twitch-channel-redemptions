import { log } from "../..";

export function onDisconnect(manually: boolean, reason?: Error) {
  if (manually) {
    log("Disconnected manually");
    return;
  }

  log("Disconnected %s", reason);
}
