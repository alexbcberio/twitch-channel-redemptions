import { addVip, hasVip } from "../../chatClient/clientActions";

import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";

async function getVip(
	msg: RedemptionMessage
): Promise<RedemptionMessage | undefined> {
	const channel = await getUsernameFromId(parseInt(msg.channelId));

	if (!channel) {
		console.log(`${LOG_PREFIX}No channel found`);

		return;
	}

	const addVipUser = msg.userDisplayName;

	if (await hasVip(channel, addVipUser)) {
		console.log(`${LOG_PREFIX}@${addVipUser} is already VIP`);

		return;
	}

	await addVip(channel, addVipUser);

	return msg;
}

export { getVip };
