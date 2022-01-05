import { chatClient } from "../..";

// timeouts a user in a channel
async function timeout(
	channel: string,
	username: string,
	time?: number,
	reason?: string
): Promise<void> {
	if (!time) {
		time = 60;
	}

	if (!reason) {
		reason = "";
	}

	await chatClient.timeout(channel, username, time, reason);
}

export { timeout };
