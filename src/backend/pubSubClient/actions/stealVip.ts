import { chatClient, say } from "../../chatClient";
import {
	saveScheduledActions,
	scheduledActions
} from "../../helpers/scheduledActions";

import { LOG_PREFIX } from "..";
import { getUsernameFromId } from "../../helpers/twitch";

// remove vip from a user to grant it to yourself
async function stealVip(msg: {
	channelId: string;
	userDisplayName: string;
	message: string;
}): Promise<boolean> {
	const channel = await getUsernameFromId(parseInt(msg.channelId));

	if (!channel) {
		console.log(`${LOG_PREFIX}No channel found`);

		return false;
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

		return true;
	}

	return false;
}

// adds a user to vips
async function addVip(
	channel: string,
	username: string,
	message?: string
): Promise<void> {
	if (!message) {
		message = `Otorgado VIP a @${username}.`;
	}

	await chatClient.addVip(channel, username);
	say(channel, message);
}

async function hasVip(channel: string, username: string): Promise<boolean> {
	if (!username) {
		return false;
	}

	const vips = await chatClient.getVips(channel);
	return vips.includes(username);
}

// removes a user from vips
async function removeVip(
	channel: string,
	username: string,
	message?: string
): Promise<void> {
	if (!message) {
		message = `Se ha acabado el chollo, VIP de @${username} eliminado.`;
	}

	await chatClient.removeVip(channel, username);
	say(channel, message);
}

export { stealVip };
