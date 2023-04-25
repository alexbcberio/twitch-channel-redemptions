import { addVip, removeVip, say, timeout } from "./clientActions";
import { extendLogger, warning } from "../helpers/log";
import { getAuthProvider, getUsernameFromId } from "../helpers/twitch";
import {
  onBan,
  onConnect,
  onDisconnect,
  onMessageRemove,
  onNoPermission,
  onTimeout,
} from "./events";

import { Action } from "../../interfaces/actions/server/Action";
import { ActionType } from "../../enums/ActionType";
import { ChatClient } from "@twurple/chat";
import { broadcast } from "../webserver";
import { messages } from "../../localization";
import { onMessage } from "./events/onMessage";

let chatClient: ChatClient;

const namespace = "ChatClient";
const log = extendLogger(namespace);

const chatClientMessages = messages.chatClient;

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
  chatClient.onDisconnect(onDisconnect);
  chatClient.onNoPermission(onNoPermission);

  chatClient.onMessage(onMessage);
  chatClient.onMessageRemove(onMessageRemove);
  chatClient.onTimeout(onTimeout);
  chatClient.onBan(onBan);

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

export { chatClient, connect, handleClientAction, namespace, log };
