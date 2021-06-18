import { PubSubClient, PubSubRedemptionMessage } from "twitch-pubsub-client";
import { broadcast, chatClient, connect, say, } from "./src/backend/chatClient";
import { getApiClient, getAuthProvider } from "./src/backend/helpers/twitch";
import { saveScheduledActions, scheduledActions } from "./src/backend/helpers/scheduledActions";

import { ApiClient } from "twitch";
import { listen, } from "./src/backend/webServer";

const channel = "alexbcberio";

let apiClient: ApiClient;

async function init() {
  const authProvider = await getAuthProvider();

  apiClient = await getApiClient();

  const pubSubClient = new PubSubClient();
  const userId = await pubSubClient.registerUserListener(apiClient, channel);
	/*const listener = */ await pubSubClient.onRedemption(userId, onRedemption);

  console.log("[Twitch PubSub] Connected & registered");

  await connect(authProvider, [channel]);

  listen();
}

init();

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