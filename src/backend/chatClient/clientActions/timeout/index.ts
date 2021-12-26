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

	try {
		await chatClient.timeout(channel, username, time, reason);
	} catch (e) {
		// user cannot be timed out
	}
}

export { timeout };
