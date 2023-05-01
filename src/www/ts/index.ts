import "@fontsource/open-sans";

interface Reward {
  id: string;
  title: string;
  cost: number;
  enabled: boolean;
  color: string;
  image: string;
}

function copyPathUrl(e: Event) {
  const target = e.target;

  if (target === null || !(target instanceof HTMLElement)) {
    return;
  }

  const path = target.getAttribute("data-path");

  if (path === null) {
    return;
  }

  navigator.clipboard.writeText(`${location.origin}${path}`);
}

function editChannelPointReward(e: Event) {
  const target = e.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const rewardId = target.closest(".reward")?.getAttribute("data-reward-id");

  if (rewardId === null) {
    return;
  }

  alert(`// TODO: edit actions of ${rewardId}`);
}

function createRewardElement(reward: Reward) {
  const rewardElement = document.createElement("div");
  rewardElement.classList.add("reward");

  if (!reward.enabled) {
    rewardElement.classList.add("reward-disabled");
  }

  rewardElement.style.setProperty("--color", reward.color);
  rewardElement.setAttribute("data-reward-id", reward.id);

  const image = document.createElement("img");
  image.src = reward.image;
  image.alt = reward.title;
  rewardElement.appendChild(image);

  const title = document.createElement("p");
  title.classList.add("title");
  title.innerText = reward.title;
  rewardElement.appendChild(title);

  const cost = document.createElement("p");
  cost.classList.add("cost");
  cost.innerText = `${reward.cost}`;
  rewardElement.appendChild(cost);

  const manage = document.createElement("td");
  manage.classList.add("actions");

  const editActions = document.createElement("button");
  editActions.classList.add("btn");
  editActions.innerText = "Edit actions";
  editActions.addEventListener("click", editChannelPointReward);
  manage.appendChild(editActions);

  rewardElement.appendChild(manage);

  return rewardElement;
}

document.addEventListener("DOMContentLoaded", async () => {
  const copyPathUrlElements =
    document.querySelectorAll<HTMLElement>(".copy-clipboard");

  for (let i = 0; i < copyPathUrlElements.length; i++) {
    copyPathUrlElements[i].addEventListener("click", copyPathUrl);
  }

  const rewardsContainer = document.querySelector<HTMLElement>(
    "#channel-point-rewards .rewards"
  );

  if (!rewardsContainer) {
    console.error("Error finding container to insert redemptions");
    return;
  }

  const res = await fetch("/api/channel-point-rewards");
  const rewards: Array<Reward> = await res.json();

  for (let i = 0; i < rewards.length; i++) {
    rewardsContainer.insertAdjacentElement(
      "beforeend",
      createRewardElement(rewards[i])
    );
  }
});
