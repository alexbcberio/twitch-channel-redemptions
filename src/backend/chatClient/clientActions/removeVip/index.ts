import { chatClient } from "../..";
import { say } from "..";

async function removeVip(
	channel: string,
	username: string,
	message?: string
): Promise<boolean> {
	try {
		await chatClient.removeVip(channel, username);
	} catch (e) {
		return false;
	}

	if (message) {
		await say(channel, message);
	}

	return true;
}

export { removeVip };
