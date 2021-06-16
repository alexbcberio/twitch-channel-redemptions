import { PubSubClient, PubSubRedemptionMessage } from "twitch-pubsub-client";
import { getApiClient, getAuthProvider } from "./src/backend/helpers/twitch";
import { listen, sockets } from "./src/backend/webServer";

import { ApiClient } from "twitch";
import { ChatClient } from "twitch-chat-client";
import { promises as fs } from "fs";

const SCHEDULED_FILE = "./scheduled.json";

const scheduledActions: Array<any> = [];
let saInterval: NodeJS.Timeout;

const channel = "alexbcberio";

let apiClient: ApiClient;
let chatClient: ChatClient;

export {
  handleClientAction,
  scheduledActions,
  saveScheduledActions
}

//! Important: store users & channels by id, not by username

async function init() {
  const authProvider = await getAuthProvider();

  apiClient = await getApiClient();

  const pubSubClient = new PubSubClient();
  const userId = await pubSubClient.registerUserListener(apiClient, channel);
	/*const listener = */ await pubSubClient.onRedemption(userId, onRedemption);

  console.log("[Twitch PubSub] Connected & registered");

  chatClient = new ChatClient(authProvider, { channels: [channel] });

  chatClient.onConnect(onConnect);

  chatClient.onDisconnect((e: any) => {
    console.log(`[ChatClient] Disconnected ${e.message}`);
  });

  chatClient.onNoPermission((channel, message) => {
    console.log(`[ChatClient] No permission on ${channel}: ${message}`);
  });

  chatClient.connect();

  listen();
}

init();

async function onConnect() {
  console.log("[ChatClient] Connected");

  // *Check this, not working
  if (!saInterval) {
    let savedActions = [];
    try {
      savedActions = JSON.parse(
        (await fs.readFile(SCHEDULED_FILE)).toString()
      );
    } catch (e) {
      // probably file does not exist
    }
    scheduledActions.push.apply(scheduledActions, savedActions);
    scheduledActions.sort((a, b) => a.scheduledAt - b.scheduledAt);

    setTimeout(checkScheduledActions, 1000 * 5);
    saInterval = setInterval(checkScheduledActions, 1000 * 60);
  }
}

async function onRedemption(message: PubSubRedemptionMessage) {
	console.log(
		`Reward: "${message.rewardName}" (${message.rewardId}) redeemed by ${message.userDisplayName}`
	);
  // @ts-ignore
  const reward = message._data.data.redemption.reward;

  let msg: any = {
    id: message.id,
    channelId: message.channelId,
    rewardId: message.rewardId,
    rewardName: message.rewardName,
		rewardImage: message.rewardImage
			? message.rewardImage.url_4x
			: "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png",
    message: message.message,
    userDisplayName: message.userDisplayName,
    // non directly available values from PubSubRedemptionMessage
    backgroundColor: reward.background_color
  };

	switch (msg.rewardId) {
    // robar vip
    case "ac750bd6-fb4c-4259-b06d-56953601243b":
      msg = await stealVip(msg);
      break;
  }

  if (msg) {
    console.log(msg);

    broadcast(msg);
  }
}

async function handleClientAction(action: any) {
  if (action.channel && !isNaN(action.channel)) {
    action.channel = await getUsernameFromId(parseInt(action.channel));
  }
  if (action.username && !isNaN(action.username)) {
    action.username = await getUsernameFromId(parseInt(action.username));
  }

	switch (action.action) {
    case "say":
      say(channel, action.message);
      break;
    case "timeout":
      await timeout(channel, action.username, action.time, action.reason);
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

let ssaTimeout: NodeJS.Timeout | null;
function saveScheduledActions() {
  if (ssaTimeout) {
    clearTimeout(ssaTimeout);
    ssaTimeout = null;
    console.log("[Scheduled] Removed save timeout.");
  }

  ssaTimeout = setTimeout(async () => {
    await fs.writeFile(SCHEDULED_FILE, JSON.stringify(scheduledActions));
    console.log("[Scheduled] Saved actions.");
    ssaTimeout = null;
  }, 1000 * 30);
}

let checkingScheduled = false;
async function checkScheduledActions() {
  if (checkingScheduled) return;
  checkingScheduled = true;

  let hasToSave = false;

  for (let i = 0; i < scheduledActions.length && scheduledActions[i].scheduledAt <= Date.now(); i++) {
    hasToSave = true;

    const action = scheduledActions.splice(i, 1)[0];
    await handleClientAction(action);
    console.log(`[Scheduled] Executed: ${JSON.stringify(action)}`);
  }

  if (hasToSave) {
    saveScheduledActions();
  }

  checkingScheduled = false;
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
function broadcast(msg: object) {
  sockets.forEach(s => s.send(JSON.stringify(msg)));
}

// adds a user to vips
async function addVip(channel: string, username: string, message?: string) {
  if (!message) {
    message = `Otorgado VIP a @${username}.`;
  }

  await chatClient.addVip(channel, username);
  say(channel, message);
}

async function hasVip(channel: string, username: string) {
  if (!username) {
    return false;
  }

  const vips = await chatClient.getVips(channel);
  return vips.includes(username);
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
  const user = await apiClient.helix.users.getUserById(userId);

  if (!user) {
    return null;
  }

  return user.displayName;
}

// remove vip from a user to grant it to yourself
async function stealVip(msg: {
	channelId: string;
	userDisplayName: string;
	message: string;
}) {
  const channel = await getUsernameFromId(parseInt(msg.channelId));

  if (!channel) {
    console.log("No channel found");
    return;
  }

  const addVipUser = msg.userDisplayName;
  const removeVipUser = msg.message;

  if (await hasVip(channel, removeVipUser)) {
    await removeVip(channel, removeVipUser);
    await addVip(channel, addVipUser);

		const scheduledRemoveVipIndex = scheduledActions.findIndex(
			s => s.action === "removeVip" && s.username === removeVipUser
		);

    if (scheduledRemoveVipIndex > -1) {
      scheduledActions[scheduledRemoveVipIndex].username = addVipUser;
      saveScheduledActions();
    }

    msg.message = `@${addVipUser} ha robado el VIP a @${removeVipUser}.`;

    return msg;
  }

  return null;
}