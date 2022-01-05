import { chatClient } from "../..";

type CacheType = Record<string, Array<string>>;
const cache: CacheType = {};

async function hasVip(channel: string, username: string): Promise<boolean> {
	if (!username) {
		return false;
	}

	if (!cache[channel]) {
		const vips = await chatClient.getVips(channel);

		// * last VIP has a "." at the end of the username (bug on library?)
		cache[channel] = vips.map(vip => vip.replace(/\.$/, ""));

		setTimeout(() => {
			delete cache[channel];
		}, 2500);
	}

	const vips = cache[channel];

	return vips.includes(username);
}

export { hasVip };
