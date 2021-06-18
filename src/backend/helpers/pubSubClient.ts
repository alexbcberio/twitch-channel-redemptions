import { PubSubClient, PubSubRedemptionMessage } from "twitch-pubsub-client";
import { chatClient, say } from "./chatClient";
import { getApiClient, getUsernameFromId } from "./twitch";
import { saveScheduledActions, scheduledActions } from "./scheduledActions";

import { UserIdResolvable } from "twitch";
import { broadcast } from "./webServer";

export {
  registerUserListener
}

const LOG_PREFIX = "[PubSub] ";

async function registerUserListener(user: UserIdResolvable) {
  const apiClient = await getApiClient();

  const pubSubClient = new PubSubClient();
  const userId = await pubSubClient.registerUserListener(apiClient, user);
	/*const listener = */ await pubSubClient.onRedemption(userId, onRedemption);

  console.log(`${LOG_PREFIX}Connected & registered`);
}

async function onRedemption(message: PubSubRedemptionMessage) {
	console.log(
		`${LOG_PREFIX}Reward: "${message.rewardName}" (${message.rewardId}) redeemed by ${message.userDisplayName}`
	);
  // @ts-ignore
  const reward = message._data.data.redemption.rewºard;

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
    console.log(LOG_PREFIX, msg);

    if (typeof msg !== "string") {
      msg = JSON.stringify(msg);
    }
    broadcast(msg);
  }
}

// TODO: extract methods

// remove vip from a user to grant it to yourself
async function stealVip(msg: {
	channelId: string;
	userDisplayName: string;
	message: string;
}) {
  const channel = await getUsernameFromId(parseInt(msg.channelId));

  if (!channel) {
    console.log(`${LOG_PREFIX}No channel found`);
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