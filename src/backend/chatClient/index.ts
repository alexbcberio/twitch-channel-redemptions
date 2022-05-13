import { addVip, removeVip, say, timeout } from "./clientActions";
import { error, extendLogger, info, warning } from "../helpers/log";
import { getAuthProvider, getUsernameFromId } from "../helpers/twitch";

import { Action } from "../../interfaces/actions/Action";
import { ActionType } from "../../enums/ActionType";
import { ChatClient } from "@twurple/chat";
import { ChatCommands } from "../../enums/ChatCommands";
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import { broadcast } from "../helpers/webServer";
import { createReward } from "./commands/createReward";
import { messages } from "../../localization";
import { start } from "../helpers/miniDb";

let chatClient: ChatClient;

const namespace = "ChatClient";
const log = extendLogger(namespace);

const chatClientMessages = messages.chatClient;

function onConnect(): Promise<void> {
  info("[%s] Connected", namespace);

  start();

  return Promise.resolve();
}

const commandPrefix = "!";

async function onMessage(
  channel: string,
  user: string,
  message: string,
  msg: TwitchPrivateMessage
): Promise<void> {
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

async function connect(channels: Array<string>): Promise<void> {
  const authProvider = await getAuthProvider();

  if (chatClient && (chatClient.isConnecting || chatClient.isConnected)) {
    return;
  }

  chatClient = new ChatClient({
    authProvider,
    channels,
    webSocket: true,
  });

  chatClient.onConnect(onConnect);

  chatClient.onDisconnect((manually, reason) => {
    if (manually) {
      log("Disconnected manually");
      return;
    }

    log("Disconnected %s", reason);
  });

  chatClient.onNoPermission((channel, message) => {
    error("[%s] No permission on %s:%s", namespace, channel, message);
  });

  chatClient.onMessage(onMessage);

  await chatClient.connect();
}

async function handleClientAction(action: Action): Promise<void> {
  const [channel, username] = await Promise.all([
    getUsernameFromId(parseInt(action.channelId)),
    getUsernameFromId(parseInt(action.userId)),
  ]);

  if (!channel || !username) {
    warning("[%s] ChannelId or userId could not be solved", namespace);
    return;
  }

  switch (action.type) {
    case ActionType.Say:
      say(channel, action.data.message);
      break;
    case ActionType.Timeout:
      try {
        await timeout(channel, username, action.data.time, action.data.reason);
      } catch (e) {
        warning(
          "[%s] Username %s cannot be timed out in %s channel",
          namespace,
          username,
          channel
        );
      }
      break;
    case ActionType.Broadcast:
      broadcast(action.data.message);
      break;
    case ActionType.AddVip:
      await addVip(channel, username, chatClientMessages.addedVip(username));
      break;
    case ActionType.RemoveVip:
      await removeVip(
        channel,
        username,
        chatClientMessages.removeVip(username)
      );
      break;
    default:
      warning("[%s] Couldn't handle action: %O", namespace, action);
  }
}

export { chatClient, connect, handleClientAction, say };
