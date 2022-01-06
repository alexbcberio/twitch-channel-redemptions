import { PubSubClient, PubSubRedemptionMessage } from "@twurple/pubsub";
import {
	cancelRewards,
	completeRewards,
	getAuthProvider
} from "../helpers/twitch";

import { RedemptionIds } from "../../enums/Redemptions";
import { RedemptionMessage } from "../../interfaces/RedemptionMessage";
import { UserIdResolvable } from "@twurple/api";
import { broadcast } from "../helpers/webServer";
import { getVip } from "./actions/getVip";
import { hidrate } from "./actions/hidrate";
import { highlightMessage } from "./actions/highlightMessage";
import { isProduction } from "../helpers/util";
import { rawDataSymbol } from "@twurple/common";
import { russianRoulette } from "./actions/russianRoulette";
import { stealVip } from "./actions/stealVip";
import { timeoutFriend } from "./actions/timeoutFriend";

const LOG_PREFIX = "[PubSub] ";

async function registerUserListener(user: UserIdResolvable) {
	const pubSubClient = new PubSubClient();
	const userId = await pubSubClient.registerUserListener(
		await getAuthProvider(),
		user
	);
	/*const listener = */ await pubSubClient.onRedemption(userId, onRedemption);

	console.log(`${LOG_PREFIX}Connected & registered`);
}

async function onRedemption(message: PubSubRedemptionMessage) {
	console.log(
		`${LOG_PREFIX}Reward: "${message.rewardTitle}" (${message.rewardId}) redeemed by ${message.userDisplayName}`
	);

	const raw = message[rawDataSymbol];

	const msg: RedemptionMessage = {
		id: message.id,
		channelId: message.channelId,
		rewardId: message.rewardId,
		rewardName: message.rewardTitle,
		rewardImage: message.rewardImage
			? message.rewardImage.url_4x
			: "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png",
		message: message.message,
		userId: message.userId,
		userDisplayName: message.userDisplayName,
		backgroundColor: raw.data.redemption.reward.background_color
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

	// TODO: improve this check
	const keepInQueueRewards = [RedemptionIds.KaraokeTime];

	// @ts-expect-error String is not assignable to... but all keys are strings
	if (keepInQueueRewards.includes(message.rewardId)) {
		console.log(`${LOG_PREFIX}Reward kept in queue due to config`);
		return;
	}

	const completeOrCancelReward =
		handledMessage && isProduction ? completeRewards : cancelRewards;

	if (message.rewardIsQueued) {
		try {
			await completeOrCancelReward(
				message.channelId,
				message.rewardId,
				message.id
			);
			console.log(
				`${LOG_PREFIX}Reward removed from queue (completed or canceled)`
			);
		} catch (e) {
			if (e instanceof Error) {
				console.log(`${LOG_PREFIX}${e.message}`);
			}
		}
	}
}

export { registerUserListener, LOG_PREFIX };
