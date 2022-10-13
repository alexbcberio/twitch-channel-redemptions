import { ChatEvent } from "../../../../enums/ChatEvent";
import { ClearChat } from "@twurple/chat/lib";
import { UserBan } from "../../../../interfaces/events/chat/UserBan";
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
    type: ChatEvent.UserBan,
    channelId: channel,
    userId,
    data: null,
  };

  broadcast(JSON.stringify(msg));
}
