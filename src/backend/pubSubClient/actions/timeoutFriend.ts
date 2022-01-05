import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { broadcast } from "../../helpers/webServer";
import { getUsernameFromId } from "../../helpers/twitch";
import { timeout } from "../../chatClient/clientActions";

async function timeoutFriend(msg: RedemptionMessage): Promise<boolean> {
	const { message, channelId, userDisplayName } = msg;
	if (!msg.message) {
		console.log(`${LOG_PREFIX}Redemption has no message`);

		return false;
	}

	const channel = await getUsernameFromId(parseInt(channelId));

	if (!channel) {
		console.log(`${LOG_PREFIX}No channel found`);

		return false;
	}

	const time = 60;
	const reason = `Timeout dado por @${userDisplayName} con puntos del canal`;

	try {
		await timeout(channel, msg.message, time, reason);

		msg.message = `@${userDisplayName} ha expulsado a @${message} por ${time} segundos`;

		broadcast(JSON.stringify(msg));
	} catch (e) {
		// user can not be timed out
		if (e instanceof Error) {
			console.error(`${LOG_PREFIX} ${e.message}`);
		}

		return false;
	}

	return true;
}

export { timeoutFriend };
