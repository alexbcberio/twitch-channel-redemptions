import { getApiClient, getAuthProvider } from "./twitch";

import { ChatClient } from "twitch-chat-client";
import { sockets } from "./webServer";
import { start } from "./scheduledActions";

let chatClient: ChatClient;

export {
  chatClient,
  connect,
  handleClientAction,
  broadcast,
  say
};

async function connect(channels: Array<any>) {
  const authProvider = await getAuthProvider(

  );
  if (
    chatClient &&
    (
    chatClient.isConnecting ||
    chatClient.isConnected
    )
  ) {
    return;
  }

  chatClient = new ChatClient(authProvider, { channels: channels });

  chatClient.onConnect(onConnect);

  chatClient.onDisconnect((e: any) => {
    console.log(`[ChatClient] Disconnected ${e.message}`);
  });

  chatClient.onNoPermission((channel, message) => {
    console.log(`[ChatClient] No permission on ${channel}: ${message}`);
  });

  await chatClient.connect();
}

async function onConnect() {
  console.log("[ChatClient] Connected");

  start();
}

async function handleClientAction(action: any) {
  if (action.channel && !isNaN(action.channel)) {
    action.channel = await getUsernameFromId(parseInt(action.channel));
  }
  if (action.username && !isNaN(action.username)) {
    action.username = await getUsernameFromId(parseInt(action.username));
  }

  // TODO: create a interface for action messages
  if (!action.channel) {
    action.channel = "alexbcberio";
  }

	switch (action.action) {
    case "say":
      say(action.channel, action.message);
      break;
    case "timeout":
      await timeout(action.channel, action.username, action.time, action.reason);
      break;
    case "broadcast":
      broadcast(action.message);
      break;
    case "addVip":
      await addVip(action.channel, action.username);
      break;
    case "removeVip":
      await removeVip(action.channel, action.username);
      break;
    default:
      console.log(`Couldn't handle action:`, action);
  }
}

// send a chat message
function say(channel: string, message: string) {
  chatClient.say(channel, message);
}

// timeouts a user in a channel
async function timeout(
	channel: string,
	username: string,
	time?: number,
	reason?: string
) {
  if (!time) {
    time = 60;
  }

  if (!reason) {
    reason = "";
  }

  try {
    await chatClient.timeout(channel, username, time, reason);
  } catch (e) {
    // user cannot be timed out
  }
}

// broadcast a message to all clients
function broadcast(msg: string, socket?: any) {
  const filteredSockets = socket
    ? sockets.filter(s => s !== socket)
    : sockets;

  filteredSockets.forEach(s => s.send(msg));
}

// adds a user to vips
async function addVip(channel: string, username: string, message?: string) {
  if (!message) {
    message = `Otorgado VIP a @${username}.`;
  }

  await chatClient.addVip(channel, username);
  say(channel, message);
}

// removes a user from vips
async function removeVip(channel: string, username: string, message?: string) {
  if (!message) {
    message = `Se ha acabado el chollo, VIP de @${username} eliminado.`;
  }

  await chatClient.removeVip(channel, username);
  say(channel, message);
}

async function getUsernameFromId(userId: number) {
  const apiClient = await getApiClient();
  const user = await apiClient.helix.users.getUserById(userId);

  if (!user) {
    return null;
  }

  return user.displayName;
}