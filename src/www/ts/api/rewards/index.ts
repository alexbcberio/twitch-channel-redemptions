import { ChannelPointReward } from "./types";

export * from "./types";

type Action = unknown;

async function getChannelPointRewards(): Promise<Array<ChannelPointReward>> {
  const res = await fetch("/api/channel-point-rewards");
  const rewards: Array<ChannelPointReward> = await res.json();

  return rewards;
}

export {
  getChannelPointRewards,
};
