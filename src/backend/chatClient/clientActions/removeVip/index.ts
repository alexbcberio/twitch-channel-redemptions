import { chatClient } from "../..";
import { say } from "..";

// removes a user from vips
async function removeVip(
	channel: string,
	username: string,
	message?: string
): Promise<void> {
	if (!message) {
		message = `VIP de @${username} eliminado.`;
	}

	await chatClient.removeVip(channel, username);
	say(channel, message);
}

export { removeVip };
