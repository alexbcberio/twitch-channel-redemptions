import { LOG_PREFIX, say } from "..";

import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import { createReward as createChannelPointsReward } from "../../helpers/twitch";

async function createReward(
	channel: string,
	user: string,
	message: string,
	msg: TwitchPrivateMessage
): Promise<void> {
	const args = message.split(" ");

	const title = args.shift();
	const cost = Math.max(1, parseInt(args.shift() ?? "0"));

	if (!title || !cost) {
		await say(
			channel,
			"No se ha especificado el nombre de la recompensa o costo"
		);
		return;
	}

	try {
		await createChannelPointsReward(msg.channelId as string, {
			title,
			cost
		});

		say(
			channel,
			`✅ Creada recompensa de canal "${title}" con un costo de ${cost}`
		);
	} catch (e) {
		if (e instanceof Error) {
			console.log(`${LOG_PREFIX}${e.message}`);
		}
	}
}

export { createReward };
