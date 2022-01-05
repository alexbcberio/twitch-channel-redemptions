import { addVip, hasVip, removeVip } from "../../chatClient/clientActions";

import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";

// remove vip from a user to grant it to yourself
async function stealVip(msg: RedemptionMessage): Promise<boolean> {
	if (!msg.message) {
		console.log(`${LOG_PREFIX}Redemption has no message`);

		return false;
	}

	const channel = await getUsernameFromId(parseInt(msg.channelId));

	if (!channel) {
		console.log(`${LOG_PREFIX}No channel found`);

		return false;
	}

	const addVipUser = msg.userDisplayName;
	const removeVipUser = msg.message;

	if (!(await hasVip(channel, removeVipUser))) {
		console.log(`${LOG_PREFIX}@${removeVipUser} is not VIP`);

		return false;
	}

	if (await hasVip(channel, addVipUser)) {
		console.log(`${LOG_PREFIX}@${addVipUser} is already VIP`);

		return false;
	}

	const removed = await removeVip(channel, removeVipUser);
	const added = await addVip(
		channel,
		addVipUser,
		`@${addVipUser} ha "tomado prestado" el VIP de @${removeVipUser}`
	);

	return removed && added;
}

export { stealVip };
