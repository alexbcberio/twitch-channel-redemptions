import { Actions, ChannelPointReward } from "./types";

export * from "./types";

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

async function saveChannelPointRewardActions(
  id: ChannelPointReward["id"],
  actions: Actions["actions"]
): Promise<void> {
  await fetch(`/api/channel-point-rewards/${id}/actions`, {
    method: "PUT",
    body: JSON.stringify({ actions }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export {
  getChannelPointRewards,
  getChannelPointRewardActions,
  saveChannelPointRewardActions,
};
