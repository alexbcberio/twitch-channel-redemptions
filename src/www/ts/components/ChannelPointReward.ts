import {
  ChannelPointReward as ChannelPointRewardType,
  getChannelPointRewardActions,
} from "../api/rewards";

const rewardActionsClassName = "reward-actions";

class ChannelPointReward extends HTMLElement {
  static get observedAttributes() {
    return ["data-reward"];
  }

  private initialized = false;
  private reward?: ChannelPointRewardType;

  public constructor() {
    super();
  }

  public connectedCallback() {
    if (!this.initialized) {
      this.initialize();
      this.initialized = true;
    }
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
        break;
    }

    this.updateData();
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

    if (actions.length === 0) {
      const noActions = document.createElement("p");
      noActions.classList.add("text-red-400", "mb-1");
      noActions.innerText = "No actions are setup for this reward";

      rewardActionsContainer.appendChild(noActions);
    } else {
      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        const eventAction = document.createElement("event-action");
        // eventAction.setAttribute("data-action", JSON.stringify(action));
        eventAction.setAttribute("data-action", action);
        eventAction.setAttribute("data-first-action", `${i === 0}`);
        eventAction.setAttribute(
          "data-last-action",
          `${i + 1 === actions.length}`
        );
        eventAction.addEventListener("move-up", this.onMoveUpAction.bind(this));
        eventAction.addEventListener(
          "move-down",
          this.onMoveDownAction.bind(this)
        );
        eventAction.addEventListener("delete", this.onDeleteAction.bind(this));

        rewardActionsContainer.appendChild(eventAction);
      }
    }

    // TODO: migrate into a component
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

  private onMoveDownAction(e: Event) {
    const target = e.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const parent = target.parentElement;

    if (!parent) {
      return;
    }

    const siblings = parent.children;

    let found = false;

    for (let i = 0; i < siblings.length && !found; i++) {
      if (siblings[i] === target && i < siblings.length - 1) {
        found = true;
        target.before(siblings[i + 1]);
      }
    }

    this.updateMoveActionButtonsDisableState();
  }

  private onMoveUpAction(e: Event) {
    const target = e.target;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const parent = target.parentElement;

    if (!parent) {
      return;
    }

    const siblings = parent.children;

    let found = false;

    for (let i = 0; i < siblings.length && !found; i++) {
      if (siblings[i] === target && i > 0) {
        found = true;
        target.after(siblings[i - 1]);
      }
    }

    this.updateMoveActionButtonsDisableState();
  }

  private onDeleteAction(_e: Event) {
    this.updateMoveActionButtonsDisableState();
  }

  private updateMoveActionButtonsDisableState() {
    const firstActions = this.querySelectorAll<HTMLElement>(
      `event-action[data-first-action="true"]`
    );

    for (let i = 0; i < firstActions.length; i++) {
      firstActions[i].setAttribute("data-first-action", "false");
    }

    const lastActions = this.querySelectorAll<HTMLElement>(
      `event-action[data-last-action="true"]`
    );

    for (let i = 0; i < lastActions.length; i++) {
      lastActions[i].setAttribute("data-last-action", "false");
    }

    const eventActions = this.querySelectorAll<HTMLElement>("event-action");

    if (eventActions.length === 0) {
      return;
    }

    eventActions[0].setAttribute("data-first-action", "true");
    eventActions[eventActions.length - 1].setAttribute(
      "data-last-action",
      "true"
    );
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
