import { addVip, removeVip, say, timeout } from "./clientActions";
import { getAuthProvider, getUsernameFromId } from "../helpers/twitch";

import { Action } from "../../interfaces/actions/Action";
import { ActionType } from "../../enums/ActionType";
import { ChatClient } from "twitch-chat-client";
import { broadcast } from "../helpers/webServer";
import { start } from "../helpers/scheduledActions";

let chatClient: ChatClient;

export { chatClient, connect, handleClientAction, say, LOG_PREFIX };

const LOG_PREFIX = "[ChatClient] ";

async function connect(channels: Array<any>): Promise<void> {
	const authProvider = await getAuthProvider();

	if (chatClient && (chatClient.isConnecting || chatClient.isConnected)) {
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

async function handleClientAction(action: Action): Promise<void> {
	const [channel, username] = await Promise.all([
		getUsernameFromId(parseInt(action.channelId)),
		getUsernameFromId(parseInt(action.userId))
	]);

	if (!channel || !username) {
		console.log(`${[LOG_PREFIX]}ChannelId or userId could not be solved`);
		return;
	}

	switch (action.type) {
		case ActionType.Say:
			say(channel, action.data.message);
			break;
		case ActionType.Timeout:
			try {
				await timeout(channel, username, action.data.time, action.data.reason);
			} catch (e) {
				// user cannot be timed out
			}
			break;
		case ActionType.Broadcast:
			broadcast(action.data.message);
			break;
		case ActionType.AddVip:
			await addVip(channel, username, `Otorgado VIP a @${username}`);
			break;
		case ActionType.RemoveVip:
			await removeVip(channel, username, `Eliminado VIP de @${username}`);
			break;
		default:
			console.log(`${[LOG_PREFIX]}Couldn't handle action:`, action);
	}
}
