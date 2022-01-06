import { chatClient } from "../..";

type CacheType = Record<string, Array<string>>;
const cache: CacheType = {};
const cacheKeepTime = 2.5e3;

interface ChannelFetching {
  channel: string;
  promise: Promise<unknown>;
}

const channelsFetching: Array<ChannelFetching> = [];

async function fetchVips(channel: string): Promise<void> {
  const alreadyChecking = channelsFetching.find((c) => c.channel === channel);

  if (alreadyChecking) {
    await alreadyChecking.promise;
  } else {
    const promise = new Promise<void>((res) => {
      chatClient.getVips(channel).then((vips) => {
        cache[channel] = vips.map((u) => u.toLowerCase());

        res();
      });
    });

    channelsFetching.push({ channel, promise });

    // eslint-disable-next-line no-magic-numbers
    const addedIdx = channelsFetching.length - 1;

    await promise;

    channelsFetching.splice(addedIdx);

    setTimeout(() => {
      delete cache[channel];
    }, cacheKeepTime);
  }
}

async function hasVip(channel: string, username: string): Promise<boolean> {
  username = username.toLowerCase();

  if (!cache[channel]) {
    await fetchVips(channel);
  }

  const vips = cache[channel];

  return vips.includes(username);
}

export { hasVip };
