import { chatClient } from "../..";

type CacheType = Record<string, Array<string>>;
const cache: CacheType = {};

async function hasVip(channel: string, username: string): Promise<boolean> {
	if (!username) {
		return false;
	}

	if (!cache[channel]) {
		cache[channel] = await chatClient.getVips(channel);

		setTimeout(() => {
			delete cache[channel];
		}, 2500);
	}

	const vips = cache[channel];

	return vips.includes(username);
}

export { hasVip };
