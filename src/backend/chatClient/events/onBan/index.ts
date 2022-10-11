import { ClearChat } from "@twurple/chat/lib";
import { EventType } from "../../../../enums/EventType";
import { UserBan } from "../../../../interfaces/events/UserBan";
import { broadcast } from "../../../webserver";
import { getUserIdFromUsername } from "../../../helpers/twitch";

export async function onBan(
  channel: string,
  user: string,
  _clearChat: ClearChat
) {
  const userId = await getUserIdFromUsername(user);

  if (userId === null) {
    return;
  }

  const msg: UserBan = {
    type: EventType.UserBan,
    channelId: channel,
    userId,
    data: null,
  };

  broadcast(JSON.stringify(msg));
}
