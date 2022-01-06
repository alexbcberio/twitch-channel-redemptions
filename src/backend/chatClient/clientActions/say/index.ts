import { chatClient } from "../..";

const maxMessageLength = 500;

async function say(channel: string, message: string): Promise<void> {
	// message = `MrDestructoid ${message}`;

	if (message.length > 500) {
		const suffix = "...";
		message = `${message.substring(
			0,
			maxMessageLength - suffix.length
		)}${suffix}`;
	}

	await chatClient.say(channel, message);
}

export { say };
