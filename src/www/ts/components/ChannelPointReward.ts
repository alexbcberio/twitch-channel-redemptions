import {
  ChannelPointReward as ChannelPointRewardType,
  getChannelPointRewardActions,
  saveChannelPointRewardActions,
} from "../api/rewards";

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
    const addAction = this.querySelector<HTMLElement>(".add-action");
    const cancelSaveActions = this.querySelector<HTMLElement>(
      ".cancel-save-actions"
    );
    const saveActions = this.querySelector<HTMLElement>(".save-actions");

    if (!editActions || !addAction || !cancelSaveActions || !saveActions) {
      return;
    }

    editActions.addEventListener("click", this.editActions.bind(this));
    // TODO: create/open modal to add a new action and add it at the bottom of the list
    // addAction.addEventListener("click", this.addActionClick.bind(this));
    cancelSaveActions.addEventListener(
      "click",
      this.closeRewardActions.bind(this)
    );
    saveActions.addEventListener("click", this.saveActions.bind(this));
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

  private async editActions() {
    if (!this.reward) {
      return;
    }

    const rewardActionsContainer = this.querySelector<HTMLElement>(
      ".reward-actions-container"
    );
    const rewardActionsElement =
      this.querySelector<HTMLElement>(".reward-actions");

    if (
      !rewardActionsContainer ||
      !rewardActionsElement ||
      rewardActionsElement.childElementCount !== 0
    ) {
      return;
    }

    const rewardActions = await getChannelPointRewardActions(this.reward.id);
    const actions = rewardActions.actions;

    if (actions.length === 0) {
      rewardActionsElement.appendChild(this.createNoActionsMessageElement());
    } else {
      for (let i = 0; i < actions.length; i++) {
        const eventAction = this.createEventActionElement(
          actions[i],
          i === 0,
          i + 1 === actions.length
        );

        rewardActionsElement.appendChild(eventAction);
      }
    }

    rewardActionsContainer.classList.remove("hidden");
  }

  private createNoActionsMessageElement() {
    const noActions = document.createElement("p");
    noActions.classList.add("text-red-400", "mb-1");
    noActions.innerText = "No actions are setup for this reward";

    return noActions;
  }

  private createEventActionElement(
    action: string,
    isFirst: boolean,
    isLast: boolean
  ) {
    const eventAction = document.createElement("event-action");
    // eventAction.setAttribute("data-action", JSON.stringify(action));
    eventAction.setAttribute("data-action", action);
    eventAction.setAttribute("data-first-action", `${isFirst}`);
    eventAction.setAttribute("data-last-action", `${isLast}`);
    eventAction.addEventListener("move-up", this.onMoveUpAction.bind(this));
    eventAction.addEventListener("move-down", this.onMoveDownAction.bind(this));
    eventAction.addEventListener("delete", this.onDeleteAction.bind(this));

    return eventAction;
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
    const rewardActionsContainer = this.querySelector<HTMLElement>(
      ".reward-actions-container"
    );
    const rewardActions = this.querySelector<HTMLElement>(".reward-actions");

    if (!rewardActions || !rewardActionsContainer) {
      return;
    }

    rewardActionsContainer.classList.add("hidden");

    while (rewardActions.firstChild) {
      rewardActions.firstChild.remove();
    }
  }

  private async saveActions() {
    if (!this.reward) {
      return;
    }

    const rewardActions = this.querySelectorAll<EventAction>("event-action");
    const actions = new Array<string>();

    for (let i = 0; i < rewardActions.length; i++) {
      const action = rewardActions[i].getAttribute("data-action");

      if (action) {
        actions.push(action);
      }
    }

    await saveChannelPointRewardActions(this.reward.id, actions);

    this.closeRewardActions();
  }
}

customElements.define("channel-point-reward", ChannelPointReward);
