import { animate } from "../../helpers/animate.css";

async function removeMessage(messageElement: HTMLElement) {
  await animate(messageElement, "fadeOutUp");
  messageElement.remove();
}

async function removeUserMessages(userId: string) {
  const messages = document.querySelectorAll<HTMLElement>(`[data-user-id="${userId}"]`);
  const promises = [];

  for (let i = 0; i < messages.length; i++) {
    promises.push(removeMessage(messages[i]));
  }

  await Promise.all(promises);
}

export { removeUserMessages, removeMessage };
