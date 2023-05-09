import { ChannelPointReward, getChannelPointRewards } from "../../api/rewards";

const rewardIdProperty = "data-reward-id";
const rewardActionsClassName = "reward-actions";

function editChannelPointReward(e: Event) {
  const target = e.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const rewardElement = target.closest(".reward");

  if (rewardElement === null) {
    return;
  }

  const rewardId = rewardElement.getAttribute(rewardIdProperty);

  if (rewardId === null) {
    return;
  }

  createRewardActionsElement(rewardId);
}

async function closeRewardActions(e: Event) {
  const target = e.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const rewardActions = target.closest<HTMLElement>(
    `.${rewardActionsClassName}`
  );

  if (rewardActions) {
    rewardActions.remove();
  }
}

function createRewardActionsElement(rewardId: string) {
  const rewardElement = document.querySelector(
    `.reward[${rewardIdProperty}="${rewardId}"]`
  );

  if (rewardElement === null) {
    return;
  }

  let rewardActionsContainer = document.querySelector(
    `.${rewardActionsClassName}[${rewardIdProperty}="${rewardId}"]`
  );

  if (rewardActionsContainer !== null) {
    return;
  }

  rewardActionsContainer = document.createElement("div");
  rewardActionsContainer.classList.add(rewardActionsClassName, "mb-4");
  rewardActionsContainer.setAttribute(rewardIdProperty, rewardId);

  // TODO: obtain reward actions
  const actionsContainer = document.createElement("div");
  actionsContainer.classList.add("reward-actions-actions");
  actionsContainer.innerHTML = "<ul>";

  for (let i = 0, size = Math.floor(Math.random() * 5) + 1; i < size; i++) {
    actionsContainer.innerHTML += `<li>Action ${
      Math.floor(Math.random() * 100) + 1
    }</li>`;
  }

  actionsContainer.innerHTML += "</ul>";

  rewardActionsContainer.appendChild(actionsContainer);

  const buttonsContainer = document.createElement("div");
  buttonsContainer.classList.add("flex", "justify-end");

  const cancelButton = document.createElement("button");
  cancelButton.classList.add("btn", "inline-block", "mr-1", "ml-1");
  cancelButton.innerText = "Cancel";
  cancelButton.addEventListener("click", closeRewardActions);

  buttonsContainer.appendChild(cancelButton);

  const saveButton = document.createElement("button");
  saveButton.classList.add("btn");
  saveButton.innerText = "Save";
  // TODO: save reward actions
  saveButton.addEventListener("click", closeRewardActions);

  buttonsContainer.appendChild(saveButton);

  rewardActionsContainer.appendChild(buttonsContainer);

  rewardElement.insertAdjacentElement("afterend", rewardActionsContainer);
}

function createChannelPointRewardElement(reward: ChannelPointReward) {
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

async function fetchChannelPointRewards(selector: string) {
  const container = document.querySelector<HTMLElement>(selector);

  if (container === null) {
    throw new Error("Provided selector does not match any element");
  }

  const rewards = await getChannelPointRewards();

  for (let i = 0; i < rewards.length; i++) {
    container.insertAdjacentElement(
      "beforeend",
      createChannelPointRewardElement(rewards[i])
    );
  }
}

export { fetchChannelPointRewards };
