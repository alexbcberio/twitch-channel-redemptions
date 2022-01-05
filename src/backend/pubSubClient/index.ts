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

	let handledMessage: RedemptionMessage | undefined;

	switch (msg.rewardId) {
		case RedemptionIds.RussianRoulette:
			handledMessage = await russianRoulette(msg);
			break;
		case RedemptionIds.TimeoutFriend:
			handledMessage = await timeoutFriend(msg);
			break;
		case RedemptionIds.HighlightMessage:
			handledMessage = await highlightMessage(msg);
			break;
		case RedemptionIds.GetVip:
			handledMessage = await getVip(msg);
			break;
		case RedemptionIds.StealVip:
			handledMessage = await stealVip(msg);
			break;
		case RedemptionIds.Hidrate:
			handledMessage = await hidrate(msg);
			break;
		default:
			console.log(`${LOG_PREFIX}Unhandled redemption ${msg.rewardId}`);

			handledMessage = msg;
			break;
	}

	if (handledMessage) {
		const rewardEnumValues = Object.values(RedemptionIds);
		const rewardIdValueIndex = rewardEnumValues.indexOf(
			// @ts-expect-error String is not assignable to... but all keys are strings
			handledMessage.rewardId
		);
		const rewardName = Object.keys(RedemptionIds)[rewardIdValueIndex];

		handledMessage.rewardId = rewardName;

		broadcast(JSON.stringify(handledMessage));
	}
}

export { registerUserListener, LOG_PREFIX };
