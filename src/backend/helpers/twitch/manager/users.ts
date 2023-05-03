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

let authenticatedUser: HelixUser | null = null;

async function getAuthenticatedUser() {
  if (authenticatedUser === null) {
    const apiClient = await getApiClient();
    const user = await apiClient.users.getMe();

    if (authenticatedUser === null) {
      authenticatedUser = user;
    }
  }

  return authenticatedUser;
}

export { getUsernameFromId, getUserIdFromUsername, getAuthenticatedUser };
