import { animate } from "../../helpers/animate.css";

async function removeMessage(messageElement: HTMLElement) {
  await animate(messageElement, "fadeOutUp");
  messageElement.remove();
}

async function removeUserMessages(userId: string) {
  const messages = document.querySelectorAll(`[data-user-id="${userId}"]`);
  const promises = [];

  for (let i = 0; i < messages.length; i++) {
    promises.push(removeMessage(messages[i] as HTMLElement));
  }

  await Promise.all(promises);
}

export { removeUserMessages, removeMessage };
