import { PubSubClient, PubSubRedemptionMessage } from "twitch-pubsub-client";

import { RedemptionIds } from "../../enums/Redemptions";
import { RedemptionMessage } from "../../interfaces/RedemptionMessage";
import { UserIdResolvable } from "twitch";
import { broadcast } from "../helpers/webServer";
import { getApiClient } from "../helpers/twitch";
import { getVip } from "./actions/getVip";
import { hidrate } from "./actions/hidrate";
import { highlightMessage } from "./actions/highlightMessage";
import { russianRoulette } from "./actions/russianRoulette";
import { stealVip } from "./actions/stealVip";
import { timeoutFriend } from "./actions/timeoutFriend";

const LOG_PREFIX = "[PubSub] ";

async function registerUserListener(user: UserIdResolvable) {
	const apiClient = await getApiClient();

	const pubSubClient = new PubSubClient();
	const userId = await pubSubClient.registerUserListener(apiClient, user);
	/*const listener = */ await pubSubClient.onRedemption(userId, onRedemption);

	console.log(`${LOG_PREFIX}Connected & registered`);
}

async function onRedemption(message: PubSubRedemptionMessage) {
	console.log(
		`${LOG_PREFIX}Reward: "${message.rewardName}" (${message.rewardId}) redeemed by ${message.userDisplayName}`
	);
	// @ts-ignore
	const reward = message._data.data.redemption.reward;

	const msg: RedemptionMessage = {
		id: message.id,
		channelId: message.channelId,
		rewardId: message.rewardId,
		rewardName: message.rewardName,
		rewardImage: message.rewardImage
			? message.rewardImage.url_4x
			: "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png",
		message: message.message,
		userId: message.userId,
		userDisplayName: message.userDisplayName,
		// non directly available values from PubSubRedemptionMessage
		backgroundColor: reward.background_color
	};

	switch (msg.rewardId) {
		case RedemptionIds.RussianRoulette:
			await russianRoulette(msg);
			break;
		case RedemptionIds.TimeoutFriend:
			await timeoutFriend(msg);
			break;
		case RedemptionIds.HighlightMessage:
			await highlightMessage(msg);
			break;
		case RedemptionIds.GetVip:
			msg.message = `@${msg.userDisplayName} ha encontrado diamantes!`;

			if (await getVip(msg)) {
				broadcast(JSON.stringify(msg));
			}
			break;
		case RedemptionIds.StealVip:
			if (await stealVip(msg)) {
				msg.message = `@${msg.userDisplayName} ha "tomado prestado" el VIP de @${msg.message}`;

				broadcast(JSON.stringify(msg));
			}
			break;
		case RedemptionIds.Hidrate:
			await hidrate(msg);
			break;
		default:
			console.log(LOG_PREFIX, msg);

			broadcast(JSON.stringify(msg));
			break;
	}
}

export { registerUserListener, LOG_PREFIX };
