import { addVip, hasVip, removeVip } from "../../chatClient/clientActions";

import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";

// remove vip from a user to grant it to yourself
async function stealVip(
	msg: RedemptionMessage
): Promise<RedemptionMessage | undefined> {
	if (!msg.message) {
		console.log(`${LOG_PREFIX}Redemption has no message`);

		return;
	}

	const channel = await getUsernameFromId(parseInt(msg.channelId));

	if (!channel) {
		console.log(`${LOG_PREFIX}No channel found`);

		return;
	}

	const addVipUser = msg.userDisplayName;
	const removeVipUser = msg.message;

	if (!(await hasVip(channel, removeVipUser))) {
		console.log(`${LOG_PREFIX}@${removeVipUser} is not VIP`);

		return;
	}

	if (await hasVip(channel, addVipUser)) {
		console.log(`${LOG_PREFIX}@${addVipUser} is already VIP`);

		return;
	}

	const removed = await removeVip(channel, removeVipUser);

	if (!removed) {
		return;
	}

	const added = await addVip(channel, addVipUser);

	if (!added) {
		await addVip(channel, removeVipUser);

		return;
	}

	msg.message = `@${addVipUser} ha "tomado prestado" el VIP de @${removeVipUser}`;

	return msg;
}

export { stealVip };
