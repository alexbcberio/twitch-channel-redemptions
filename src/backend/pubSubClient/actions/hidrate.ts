import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { broadcast } from "../../helpers/webServer";
import { getUsernameFromId } from "../../helpers/twitch";
import { say } from "../../chatClient";

async function hidrate(msg: RedemptionMessage): Promise<void> {
	const channel = await getUsernameFromId(parseInt(msg.channelId));

	if (!channel) {
		console.log(`${LOG_PREFIX}No channel found`);

		return;
	}

	msg.message = `@${msg.userDisplayName} ha invitado a una ronda`;

	broadcast(JSON.stringify(msg));

	await say(channel, "waterGang waterGang waterGang");
}

export { hidrate };
