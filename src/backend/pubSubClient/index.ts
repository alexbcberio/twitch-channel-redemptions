import { PubSubClient, PubSubRedemptionMessage } from "twitch-pubsub-client";

import { UserIdResolvable } from "twitch";
import { broadcast } from "../helpers/webServer";
import { getApiClient } from "../helpers/twitch";
import { stealVip } from "./actions/stealVip";

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

	const msg = {
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
		// robar vip
		case "ac750bd6-fb4c-4259-b06d-56953601243b":
			if (await stealVip(msg)) {
				msg.message = `@${msg.userDisplayName} ha robado el VIP a @${msg.message}.`;

				broadcast(JSON.stringify(msg));
			}
			break;
		default:
			console.log(LOG_PREFIX, msg);

			broadcast(JSON.stringify(msg));
			break;
	}
}

export { registerUserListener, LOG_PREFIX };
