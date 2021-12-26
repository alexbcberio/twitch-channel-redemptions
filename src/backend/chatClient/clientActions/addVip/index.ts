import { chatClient } from "../..";
import { say } from "..";

// adds a user to vips
async function addVip(
	channel: string,
	username: string,
	message?: string
): Promise<void> {
	if (!message) {
		message = `Otorgado VIP a @${username}.`;
	}

	await chatClient.addVip(channel, username);
	say(channel, message);
}

export { addVip };
