import { ChannelPointReward, getChannelPointRewards } from "../../api/rewards";

function createChannelPointRewardElement(reward: ChannelPointReward) {
  const channelPointReward = document.createElement("channel-point-reward", {});
  channelPointReward.setAttribute("data-reward", JSON.stringify(reward));

  return channelPointReward;
}

async function fetchChannelPointRewards(containerSelector: string) {
  const container = document.querySelector<HTMLElement>(containerSelector);

  if (container === null) {
    throw new Error("Provided selector does not match any element");
  }

  const rewards = await getChannelPointRewards();

  for (let i = 0; i < rewards.length; i++) {
    container.append(createChannelPointRewardElement(rewards[i]));
  }
}

export { fetchChannelPointRewards };
