class EventAction extends HTMLElement {
  static get observedAttributes() {
    return ["data-action", "data-first-action", "data-last-action"];
  }

  private initialized = false;
  private eventAction?: string;
  private firstAction = false;
  private lastAction = false;

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
      case "data-action":
        this.eventAction = newValue;
        break;
      case "data-first-action":
        this.firstAction = newValue.toLowerCase() !== "false";
        break;
      case "data-last-action":
        this.lastAction = newValue.toLowerCase() !== "false";
        break;
    }

    this.updateData();
  }

  private initialize() {
    const template = document.querySelector<HTMLTemplateElement>(
      "#event-action-template"
    );
    const eventAction = this.getAttribute("data-action");
    const firstAction = this.getAttribute("data-first-action");
    const lastAction = this.getAttribute("data-last-action");

    if (firstAction) {
      this.firstAction = firstAction.toLowerCase() !== "false";
    }

    if (lastAction) {
      this.lastAction = lastAction.toLowerCase() !== "false";
    }

    if (!template || !eventAction) {
      return;
    }

    // this.eventAction = JSON.parse(eventAction);
    this.eventAction = eventAction;

    const templateContent = template.content.cloneNode(true);

    this.append(templateContent);
    this.updateData();

    const moveUp = this.querySelector<HTMLButtonElement>(".move-up");
    const moveDown = this.querySelector<HTMLButtonElement>(".move-down");
    const actionEdit = this.querySelector<HTMLButtonElement>(".action-edit");
    const actionDelete =
      this.querySelector<HTMLButtonElement>(".action-delete");

    if (!moveUp || !moveDown || !actionEdit || !actionDelete) {
      return;
    }

    moveUp.addEventListener("click", this.triggerMoveUp.bind(this));
    moveDown.addEventListener("click", this.triggerMoveDown.bind(this));
    actionDelete.addEventListener("click", this.triggerDelete.bind(this));
  }

  private updateData() {
    if (!this.eventAction) {
      return;
    }

    const actionName = this.querySelector<HTMLElement>(".action-name");
    const moveUp = this.querySelector<HTMLButtonElement>(".move-up");
    const moveDown = this.querySelector<HTMLButtonElement>(".move-down");

    if (!actionName || !moveUp || !moveDown) {
      return;
    }

    actionName.innerText = this.eventAction;
    moveUp.disabled = this.firstAction;
    moveDown.disabled = this.lastAction;
  }

  private triggerMoveUp() {
    const moveUpEvent = new CustomEvent("move-up");
    this.dispatchEvent(moveUpEvent);
  }

  private triggerMoveDown() {
    const moveDownEvent = new CustomEvent("move-down");
    this.dispatchEvent(moveDownEvent);
  }

  private triggerDelete() {
    const deleteEvent = new CustomEvent("delete");
    this.remove();
    this.dispatchEvent(deleteEvent);
  }
}

customElements.define("event-action", EventAction);
