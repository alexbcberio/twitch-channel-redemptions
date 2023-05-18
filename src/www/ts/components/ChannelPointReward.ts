import {
  ChannelPointReward as ChannelPointRewardType,
  getChannelPointRewardActions,
} from "../api/rewards";

const rewardActionsClassName = "reward-actions";

class ChannelPointReward extends HTMLElement {
  static get observedAttributes() {
    return ["data-reward"];
  }

  private reward?: ChannelPointRewardType;

  public constructor() {
    super();
  }

  public connectedCallback() {
    this.initialize();
  }

  public disconnectedCallback() {
    // removed from DOM
  }

  public attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string
  ) {
    switch (name) {
      case "data-reward":
        this.reward = JSON.parse(newValue);
        this.updateData();
        break;
    }
  }

  private initialize() {
    const template = document.querySelector<HTMLTemplateElement>(
      "#channel-point-reward-template"
    );
    const rewardData = this.getAttribute("data-reward");

    if (!template || !rewardData) {
      return;
    }

    const templateContent = template.content.cloneNode(true);

    this.reward = JSON.parse(rewardData);

    if (!this.reward) {
      return;
    }

    this.append(templateContent);
    this.updateData();

    const editActions = this.querySelector<HTMLButtonElement>(".edit-actions");

    if (!editActions) {
      return;
    }

    editActions.addEventListener("click", this.editActionsClick.bind(this));
  }

  private updateData() {
    if (!this.reward) {
      return;
    }

    const rewardTitle = this.querySelector<HTMLElement>(".reward-title");
    const rewardCost = this.querySelector<HTMLElement>(".reward-cost");
    const rewardImage = this.querySelector<HTMLImageElement>(".reward-image");
    const editActions = this.querySelector<HTMLButtonElement>(".edit-actions");

    if (!rewardTitle || !rewardCost || !rewardImage || !editActions) {
      return;
    }

    rewardTitle.innerText = this.reward.title;
    rewardCost.innerText = `${this.reward.cost}`;
    rewardImage.src = this.reward.image;
    rewardImage.alt = this.reward.title;
    this.style.setProperty("--color", this.reward.color);
    this.classList.toggle("reward-disabled", !this.reward.enabled);
  }

  private async editActionsClick(e: Event) {
    // TODO: handle edit actions click
    if (!this.reward) {
      return;
    }

    e.preventDefault();

    let rewardActionsContainer = this.querySelector(
      `.${rewardActionsClassName}`
    );

    if (rewardActionsContainer !== null) {
      return;
    }

    rewardActionsContainer = document.createElement("div");
    rewardActionsContainer.classList.add(rewardActionsClassName, "mb-4");

    const rewardActions = await getChannelPointRewardActions(this.reward.id);
    const actions = rewardActions.actions;

    const actionsList = document.createElement("ul");
    actionsList.classList.add("list-unstyled");

    if (actions.length === 0) {
      const noActions = document.createElement("li");
      noActions.classList.add("text-red-400", "mb-1");
      noActions.innerText = "No actions are setup for this reward";

      actionsList.appendChild(noActions);
    } else {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        const actionElement = document.createElement("li");
        actionElement.classList.add("mb-1", "reward-action");
        actionElement.setAttribute("data-action", JSON.stringify(action));

        const upBtn = document.createElement("button");
        upBtn.classList.add("btn", "mr-1");
        upBtn.innerText = "Move up";
        upBtn.addEventListener("click", () => {
          // TODO: move action up
        });
        actionElement.appendChild(upBtn);

        const downBtn = document.createElement("button");
        downBtn.classList.add("btn", "mr-2");
        downBtn.innerText = "Move down";
        downBtn.addEventListener("click", () => {
          // TODO: move action down
        });
        actionElement.appendChild(downBtn);

        actionElement.append(action);

        actionsList.appendChild(actionElement);
      }
    }

    rewardActionsContainer.appendChild(actionsList);

    const addActionButton = document.createElement("button");
    addActionButton.classList.add("btn", "mt-2");
    addActionButton.innerText = "Add action";
    addActionButton.addEventListener("click", () => {
      // TODO: create/open modal to add a new action and add it at the bottom of the list
    });
    rewardActionsContainer.appendChild(addActionButton);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.classList.add("flex", "justify-end");

    const cancelButton = document.createElement("button");
    cancelButton.classList.add("btn", "inline-block", "mr-1");
    cancelButton.innerText = "Cancel";
    cancelButton.addEventListener("click", this.closeRewardActions.bind(this));

    buttonsContainer.appendChild(cancelButton);

    const saveButton = document.createElement("button");
    saveButton.classList.add("btn");
    saveButton.innerText = "Save";
    saveButton.addEventListener("click", this.saveActionsClick.bind(this));

    buttonsContainer.appendChild(saveButton);

    rewardActionsContainer.appendChild(buttonsContainer);

    this.insertAdjacentElement("beforeend", rewardActionsContainer);
  }

  private closeRewardActions() {
    const rewardActions = this.querySelector(`.${rewardActionsClassName}`);

    if (!rewardActions) {
      return;
    }

    rewardActions.remove();
  }

  private saveActionsClick() {
    // TODO: handle save

    this.closeRewardActions();
  }
}

customElements.define("channel-point-reward", ChannelPointReward);
