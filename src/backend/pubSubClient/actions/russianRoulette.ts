import { say, timeout } from "../../chatClient/clientActions";

import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";
import { randomInt } from "crypto";

type GunsSafeShots = Record<string, number>;
const gunsSafeShots: GunsSafeShots = {};

const timeoutSeconds = 60;
const maxSafeShots = 5;

async function russianRoulette(
	msg: RedemptionMessage
): Promise<RedemptionMessage | undefined> {
	const { channelId, userDisplayName } = msg;
	const channel = await getUsernameFromId(parseInt(channelId));

	if (!channel) {
		console.log(`${LOG_PREFIX}No channel found`);

		return;
	}

	if (!gunsSafeShots[channelId]) {
		gunsSafeShots[channelId] = maxSafeShots;
	}

	const win =
		gunsSafeShots[channelId] > 0 &&
		randomInt(gunsSafeShots[channelId]-- + 1) !== 0;

	if (gunsSafeShots[channelId] < 0 || !win) {
		gunsSafeShots[channelId] = maxSafeShots;
	}

	msg.message = win ? "" : "got shot";

	const promises: Array<Promise<unknown>> = [];

	if (!win) {
		promises.push(
			timeout(channel, userDisplayName, timeoutSeconds, "F en la ruleta")
		);
		promises.push(
			say(
				channel,
				`PepeHands ${userDisplayName} no ha sobrevivido para contarlo`
			)
		);
	} else {
		promises.push(say(channel, `rdCool Clap ${userDisplayName}`));
	}

	try {
		await Promise.allSettled(promises);
	} catch (e) {
		if (e instanceof Error) {
			console.log(`${LOG_PREFIX}${e.message}`);
		}
	}

	return msg;
}

export { russianRoulette };
