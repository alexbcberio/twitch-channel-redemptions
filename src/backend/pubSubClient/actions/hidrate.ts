import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";
import { say } from "../../chatClient";

async function hidrate(
	msg: RedemptionMessage
): Promise<RedemptionMessage | undefined> {
	const channel = await getUsernameFromId(parseInt(msg.channelId));

	if (!channel) {
		console.log(`${LOG_PREFIX}No channel found`);

		return;
	}

	msg.message = `@${msg.userDisplayName} ha invitado a una ronda`;

	await say(channel, "waterGang waterGang waterGang");

	return msg;
}

export { hidrate };
