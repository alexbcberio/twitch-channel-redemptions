import { error } from "../../../helpers/log";
import { namespace } from "../..";

export function onNoPermission(channel: string, message: string) {
  error("[%s] No permission on %s:%s", namespace, channel, message);
}
