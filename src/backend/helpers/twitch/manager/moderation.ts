import { HelixBanUserRequest } from "@twurple/api/lib";
import { getApiClient } from "./auth";
import { getUserIdFromUsername } from "./users";

const defaultTimeoutDuration = 60;

async function timeoutOrBan(
  channel: string,
  username: string,
  reason?: string,
  duration?: number
) {
  const userId = await getUserIdFromUsername(username);

  if (!userId) {
    throw new Error(`Username ${username} does not exist`);
  }

  const apiClient = await getApiClient();

  if (!reason) {
    reason = "";
  }

  const options: HelixBanUserRequest = {
    userId,
    reason,
  };

  if (typeof duration === "number") {
    options.duration = duration;
  }

  await apiClient.moderation.banUser(channel, channel, options);
}

async function timeout(
  channel: string,
  username: string,
  duration?: number,
  reason?: string
) {
  if (typeof duration === "undefined") {
    duration = defaultTimeoutDuration;
  }

  await timeoutOrBan(channel, username, reason, duration);
}

async function ban(channel: string, username: string, reason?: string) {
  await timeoutOrBan(channel, username, reason);
}

export { timeout, ban };
