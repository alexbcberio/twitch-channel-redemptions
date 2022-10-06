import { ChatCommands } from "../../../../enums/ChatCommands";
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
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

export async function onMessage(
  channel: string,
  user: string,
  message: string,
  msg: TwitchPrivateMessage
): Promise<void> {
  await handleChatCommand(channel, user, message, msg);
}
