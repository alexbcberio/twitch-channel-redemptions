import { chatClient } from "../..";

const defaultTime = 60;

async function timeout(
  channel: string,
  username: string,
  time?: number,
  reason?: string
): Promise<void> {
  if (!time) {
    time = defaultTime;
  }

  if (!reason) {
    reason = "";
  }

  await chatClient.timeout(channel, username, time, reason);
}

export { timeout };
