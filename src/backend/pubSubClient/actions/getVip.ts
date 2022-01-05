import { addVip, hasVip, removeVip } from "../../chatClient/clientActions";
import { save, vipUsers } from "../../helpers/miniDb";

import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";

const MAX_VIPS = 3;

async function getVip(
	msg: RedemptionMessage
): Promise<RedemptionMessage | undefined> {
	const channelId = parseInt(msg.channelId);
	const channel = await getUsernameFromId(channelId);

	if (!channel) {
		console.log(`${LOG_PREFIX}No channel found`);

		return;
	}

	const addVipUser = msg.userDisplayName;

	if (await hasVip(channel, addVipUser)) {
		console.log(`${LOG_PREFIX}@${addVipUser} is already VIP`);

		return;
	}

	const users = vipUsers[channelId];

	if (users.length >= MAX_VIPS) {
		const user = users.shift();

		if (user) {
			await removeVip(channel, user);
		}
	}

	await addVip(channel, addVipUser);

	users.push(addVipUser);
	save();

	return msg;
}

export { getVip };
