import { chatClient } from "../..";

// send a chat message
async function say(channel: string, message: string): Promise<void> {
	await chatClient.say(channel, message);
}

export { say };
