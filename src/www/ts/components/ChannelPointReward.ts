import {
  Action,
  ChannelPointReward as ChannelPointRewardType,
  getChannelPointRewardActions,
  saveChannelPointRewardActions,
} from "../api/rewards";
import { RewardActionTypes, rewardActionTypes } from "../api/actions";

let actionTypeValues: RewardActionTypes;

rewardActionTypes().then((actions) => (actionTypeValues = actions));

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
    const actionTypes = this.querySelector<HTMLSelectElement>(".action-types");
    const addAction = this.querySelector<HTMLElement>(".add-action");
    const cancelSaveActions = this.querySelector<HTMLElement>(
      ".cancel-save-actions"
    );
    const saveActions = this.querySelector<HTMLElement>(".save-actions");

    if (
      !editActions ||
      !actionTypes ||
      !addAction ||
      !cancelSaveActions ||
      !saveActions
    ) {
      return;
    }

    for (let i = 0; i < actionTypeValues.actionTypes.length; i++) {
      const actionType = actionTypeValues.actionTypes[i];
      const option = document.createElement("option");

      option.innerText =
        actionType.charAt(0).toUpperCase() +
        actionType.replace(/([A-Z])/g, " $1").slice(1);
      option.value = actionType;

      actionTypes.options.add(option);
    }

    editActions.addEventListener("click", this.editActions.bind(this));
    addAction.addEventListener("click", this.addNewAction.bind(this));
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
      this.showNoActions();
    } else {
      for (let i = 0; i < actions.length; i++) {
        this.addAction(actions[i], i === 0, i + 1 === actions.length);
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

  private showNoActions() {
    const rewardActions = this.querySelector<HTMLElement>(".reward-actions");

    if (!rewardActions) {
      return;
    }

    rewardActions.appendChild(this.createNoActionsMessageElement());
  }

  private addAction(action: Action, isFirst: boolean, isLast: boolean) {
    const rewardActions = this.querySelector<HTMLElement>(".reward-actions");

    if (!rewardActions) {
      return;
    }

    const noActions = rewardActions.firstChild;

    if (
      noActions &&
      noActions.nodeName === this.createNoActionsMessageElement().nodeName
    ) {
      noActions.remove();
    }

    const eventAction = this.createEventActionElement(action, isFirst, isLast);

    rewardActions.appendChild(eventAction);
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
    const rewardActions = this.querySelector<HTMLElement>(".reward-actions");

    if (rewardActions && rewardActions.childElementCount === 0) {
      this.showNoActions();

      return;
    }

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

  private addNewAction() {
    const actionTypes = this.querySelector<HTMLSelectElement>(".action-types");
    const rewardActionsElement =
      this.querySelector<HTMLElement>(".reward-actions");

    if (
      !actionTypes ||
      actionTypes.selectedIndex === 0 ||
      !rewardActionsElement
    ) {
      return;
    }

    this.addAction(
      actionTypes.options[actionTypes.selectedIndex].value,
      false,
      true
    );

    this.updateMoveActionButtonsDisableState();
    actionTypes.selectedIndex = 0;
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
