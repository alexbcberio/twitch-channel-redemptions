import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";
import { timeout } from "../../chatClient/clientActions";

async function highlightMessage(
	msg: RedemptionMessage
): Promise<RedemptionMessage | undefined> {
	if (!msg.message) {
		console.log(`${LOG_PREFIX}Redemption has no message`);

		return;
	}

	const urlRegex =
		/(https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&/=]*)/;

	if (urlRegex.test(msg.message)) {
		console.log(`${LOG_PREFIX}Message contains a url`);
		const channel = await getUsernameFromId(parseInt(msg.channelId));

		if (!channel) {
			console.log(`${LOG_PREFIX}No channel found`);

			return;
		}

		try {
			const reason = "No se permite enviar enlaces en mensajes destacados";

			await timeout(channel, msg.userDisplayName, 10, reason);
		} catch (e) {
			// user probably cannot be timed out
		}

		return;
	}

	return msg;
}

export { highlightMessage };
