import { HelixBanUserRequest } from "@twurple/api/lib";
import { getApiClient } from "./auth";

const defaultTimeoutDuration = 60;

async function timeoutOrBan(
  channelId: string,
  userId: string,
  reason?: string,
  duration?: number
) {
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

  await apiClient.moderation.banUser(channelId, channelId, options);
}

async function timeout(
  channelId: string,
  userId: string,
  duration?: number,
  reason?: string
) {
  if (typeof duration === "undefined") {
    duration = defaultTimeoutDuration;
  }

  await timeoutOrBan(channelId, userId, reason, duration);
}

async function ban(channelId: string, userId: string, reason?: string) {
  await timeoutOrBan(channelId, userId, reason);
}

export { timeout, ban };
