import { hasVip, say } from "..";

import { chatClient } from "../..";

async function removeVip(
  channel: string,
  username: string,
  message?: string
): Promise<boolean> {
  username = username.toLowerCase();

  if (await hasVip(channel, username)) {
    return false;
  }

  try {
    await chatClient.removeVip(channel, username);
  } catch (e) {
    return false;
  }

  if (message) {
    await say(channel, message);
  }

  return true;
}

export { removeVip };
