import { ChannelPointReward } from "./types";

export * from "./types";

type Action = string;
type Actions = {
  actions: Array<Action>;
};

async function getChannelPointRewards(): Promise<Array<ChannelPointReward>> {
  const res = await fetch("/api/channel-point-rewards");
  const rewards: Array<ChannelPointReward> = await res.json();

  return rewards;
}

async function getChannelPointRewardActions(
  id: ChannelPointReward["id"]
): Promise<Actions> {
  const res = await fetch(`/api/channel-point-rewards/${id}/actions`);
  const actions: Actions = await res.json();

  return actions;
}

export {
  getChannelPointRewards,
  getChannelPointRewardActions,
};
