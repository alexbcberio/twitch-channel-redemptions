import { getUserIdFromUsername } from "../../../helpers/twitch";
import { say } from "..";

async function removeVip(
  channel: string,
  username: string,
  message?: string
): Promise<boolean> {
  const [channelId, userId] = await Promise.all([
    getUserIdFromUsername(channel),
    getUserIdFromUsername(username),
  ]);

  if (!channelId || !userId) {
    return false;
  }

  const vipRemoved = await removeVip(channelId, userId);

  if (!vipRemoved) {
    return false;
  }

  if (message) {
    await say(channel, message);
  }

  return true;
}

export { removeVip };
