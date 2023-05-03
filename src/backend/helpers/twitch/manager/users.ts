import { HelixUser } from "@twurple/api";
import { getApiClient } from "./auth";

async function getUsernameFromId(userId: number): Promise<string | null> {
  const apiClient = await getApiClient();
  const user = await apiClient.users.getUserById(userId);

  if (!user) {
    return null;
  }

  return user.displayName;
}

async function getUserIdFromUsername(username: string): Promise<string | null> {
  const apiClient = await getApiClient();
  const user = await apiClient.users.getUserByName(username);

  if (!user) {
    return null;
  }

  return user.id;
}

let streamerUser: HelixUser | null = null;

async function getStreamerUser() {
  if (streamerUser === null) {
    const apiClient = await getApiClient();

    const username = process.env.TWITCH_CHANNEL_NAME;

    if (typeof username !== "string") {
      throw new Error(
        "TWITCH_CHANNEL_NAME environment variable not found in .env"
      );
    }

    const user = await apiClient.users.getUserByName(username);

    if (user === null) {
      throw new Error(`User ${username} does not exist`);
    }

    // eslint-disable-next-line require-atomic-updates
    streamerUser = user;
  }

  return streamerUser;
}

export { getUsernameFromId, getUserIdFromUsername, getStreamerUser };
