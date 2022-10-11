import { ChatMessageRemoveEvent } from "../../../../interfaces/events/ChatMessageRemoveEvent";
import { ClearMsg } from "@twurple/chat";
import { EventType } from "../../../../enums/EventType";
import { broadcast } from "../../../webserver";

function broadcastMessageRemove(
  channelId: string,
  messageId: string,
  _msg: ClearMsg
) {
  const broadcastMessageRemove: ChatMessageRemoveEvent = {
    type: EventType.ChatMessageRemove,
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
