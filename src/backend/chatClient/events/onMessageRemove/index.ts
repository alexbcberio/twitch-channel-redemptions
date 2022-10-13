import { ChatEvent } from "../../../../enums/ChatEvent";
import { ChatMessageRemoveEvent } from "../../../../interfaces/events/chat/ChatMessageRemoveEvent";
import { ClearMsg } from "@twurple/chat";
import { broadcast } from "../../../webserver";

function broadcastMessageRemove(
  channelId: string,
  messageId: string,
  _msg: ClearMsg
) {
  const broadcastMessageRemove: ChatMessageRemoveEvent = {
    type: ChatEvent.ChatMessageRemove,
    channelId,
    data: {
      messageId,
    },
  };

  broadcast(JSON.stringify(broadcastMessageRemove));
}

export function onMessageRemove(
  channelId: string,
  messageId: string,
  msg: ClearMsg
) {
  broadcastMessageRemove(channelId, messageId, msg);
}
