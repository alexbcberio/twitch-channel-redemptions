import { EventType } from "../../../../enums/EventType";
import { UserTimeout } from "../../../../interfaces/events/UserTimeout";
import { broadcast } from "../../../webserver";
import { getUserIdFromUsername } from "../../../helpers/twitch";

export async function onTimeout(
  channel: string,
  user: string,
  duration: number
) {
  const userId = await getUserIdFromUsername(user);

  if (userId === null) {
    return;
  }

  const msg: UserTimeout = {
    type: EventType.UserTimeout,
    channelId: channel,
    userId,
    data: {
      duration,
    },
  };

  broadcast(JSON.stringify(msg));
}
