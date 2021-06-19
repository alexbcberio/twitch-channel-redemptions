import { getAuthProvider, getUsernameFromId } from "./twitch";

import { ChatClient } from "twitch-chat-client";
import { broadcast } from "./webServer";
import { start } from "./scheduledActions";

let chatClient: ChatClient;

export {
	chatClient,
	connect,
	handleClientAction,
	say
};

// TODO: clean/refactor code

const LOG_PREFIX = "[ChatClient] ";

async function connect(channels: Array<any>): Promise<void> {
	const authProvider = await getAuthProvider();

	if (
    chatClient &&
    (
      chatClient.isConnecting ||
      chatClient.isConnected
    )
  ) {
		return;
	}

	chatClient = new ChatClient(authProvider, { channels: channels });

	chatClient.onConnect(onConnect);

	chatClient.onDisconnect((e: any) => {
		console.log(`${LOG_PREFIX}Disconnected ${e.message}`);
	});

	chatClient.onNoPermission((channel, message) => {
		console.log(`${LOG_PREFIX}No permission on ${channel}: ${message}`);
	});

	await chatClient.connect();
}

async function onConnect(): Promise<void> {
	console.log(`${LOG_PREFIX}Connected`);

	start();
}

async function handleClientAction(action: any): Promise<void> {
	if (
    action.channel &&
    !isNaN(action.channel)
  ) {
		action.channel = await getUsernameFromId(parseInt(action.channel));
	}

	if (
    action.username &&
    !isNaN(action.username)
  ) {
		action.username = await getUsernameFromId(parseInt(action.username));
	}

	// TODO: create a interface for action messages
	if (!action.channel) {
		action.channel = "alexbcberio";
	}

	switch (action.action) {
		case "say":
			say(action.channel, action.message);
			break;
		case "timeout":
			await timeout(
				action.channel,
				action.username,
				action.time,
				action.reason
			);
			break;
		case "broadcast":
			broadcast(action.message);
			break;
		case "addVip":
			await addVip(action.channel, action.username);
			break;
		case "removeVip":
			await removeVip(action.channel, action.username);
			break;
		default:
			console.log(`${[LOG_PREFIX]}Couldn't handle action:`, action);
	}
}

// send a chat message
async function say(channel: string, message: string): Promise<void> {
	await chatClient.say(channel, message);
}

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
