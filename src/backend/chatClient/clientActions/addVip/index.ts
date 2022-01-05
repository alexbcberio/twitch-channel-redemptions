import { chatClient } from "../..";
import { say } from "..";

async function addVip(
	channel: string,
	username: string,
	message?: string
): Promise<boolean> {
	try {
		await chatClient.addVip(channel, username);
	} catch (e) {
		return false;
	}

	if (message) {
		await say(channel, message);
	}

	return true;
}

export { addVip };
