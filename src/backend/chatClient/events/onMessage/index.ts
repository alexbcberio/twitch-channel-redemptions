import { ChatCommands } from "../../../../enums/ChatCommands";
import { ChatMessageEvent } from "../../../../interfaces/events/ChatMessageEvent";
import { EventType } from "../../../../enums/EventType";
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import { broadcast } from "../../../webserver";
import { createReward } from "../../commands/createReward";
import { messages } from "../../../../localization";
import { namespace } from "../..";
import { say } from "../../clientActions";
import { warning } from "../../../helpers/log";

const chatClientMessages = messages.chatClient;
const commandPrefix = "!";

async function handleChatCommand(
  channel: string,
  user: string,
  message: string,
  msg: TwitchPrivateMessage
) {
  if (msg.userInfo.isBroadcaster && message.startsWith(commandPrefix)) {
    message = message.substring(commandPrefix.length);

    const args = message.split(" ");
    const commandName = args.shift();

    switch (commandName?.toLowerCase()) {
      case ChatCommands.Commands.toLowerCase():
        await say(
          channel,
          chatClientMessages.availableCommands(Object.values(ChatCommands))
        );
        break;
      case ChatCommands.CreateReward.toLowerCase():
        await createReward(channel, user, args.join(" "), msg);
        break;
      default:
        warning(
          "[%s] Command %s%s not handled",
          namespace,
          commandPrefix,
          commandName
        );
    }
  }
}

function broadcastMessage(
  _channel: string,
  user: string,
  message: string,
  msg: TwitchPrivateMessage
) {
  if (!msg.channelId) {
    return;
  }

  const { userInfo } = msg;
  const fallbackUserColor = "#fff";

  const broadcastMessage: ChatMessageEvent = {
    type: EventType.ChatMessage,
    channelId: msg.channelId,
    userId: userInfo.userId,
    data: {
      user: {
        name: user,
        color: userInfo.color ?? fallbackUserColor,
        isMod: userInfo.isBroadcaster || userInfo.isMod,
      },
      message: {
        id: msg.id,
        text: message,
      },
    },
  };

  broadcast(JSON.stringify(broadcastMessage));
}

export async function onMessage(
  channel: string,
  user: string,
  message: string,
  msg: TwitchPrivateMessage
): Promise<void> {
  broadcastMessage(channel, user, message, msg);

  await handleChatCommand(channel, user, message, msg);
}
