import { addVip, hasVip } from "../../chatClient/clientActions";

import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";

async function getVip(msg: RedemptionMessage): Promise<boolean> {
	const channel = await getUsernameFromId(parseInt(msg.channelId));

	if (!channel) {
		console.log(`${LOG_PREFIX}No channel found`);

		return false;
	}

	const addVipUser = msg.userDisplayName;

	if (await hasVip(channel, addVipUser)) {
		console.log(`${LOG_PREFIX}@${addVipUser} is already VIP`);

		return false;
	}

	const addedVip = await addVip(channel, addVipUser, msg.message);

	return addedVip;
}

export { getVip };
