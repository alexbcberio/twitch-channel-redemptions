import { getUserIdFromUsername } from "../../../helpers/twitch";
import { say } from "..";

async function addVip(
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

  const vipAdded = await addVip(channelId, userId);

  if (!vipAdded) {
    return false;
  }

  if (message) {
    await say(channel, message);
  }

  return true;
}

export { addVip };
