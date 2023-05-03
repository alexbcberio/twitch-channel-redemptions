import { getApiClient } from "./auth";

async function hasVip(channelId: string, userId: string): Promise<boolean> {
  const apiClient = await getApiClient();

  let vips = await apiClient.channels.getVips(channelId);
  let user = vips.data.find((user) => user.id === userId);

  while (typeof user === "undefined" && typeof vips.cursor !== "undefined") {
    vips = await apiClient.channels.getVips(channelId, {
      after: vips.cursor,
    });

    user = vips.data.find((user) => user.id === userId);
  }

  return typeof user !== "undefined";
}

async function addVip(channelId: string, userId: string): Promise<boolean> {
  const isVip = await hasVip(channelId, userId);

  if (isVip) {
    return false;
  }

  const apiClient = await getApiClient();

  try {
    await apiClient.channels.addVip(channelId, userId);
  } catch (e) {
    return false;
  }

  return true;
}

async function removeVip(channelId: string, userId: string): Promise<boolean> {
  const isVip = await hasVip(channelId, userId);

  if (!isVip) {
    return false;
  }

  const apiClient = await getApiClient();

  try {
    await apiClient.channels.removeVip(channelId, userId);
  } catch (e) {
    return false;
  }

  return true;
}

export { hasVip, addVip, removeVip };
