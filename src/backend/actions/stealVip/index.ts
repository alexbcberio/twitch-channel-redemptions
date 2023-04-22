import { addVip, hasVip, removeVip, say } from "../../chatClient/clientActions";
import { save, vipUsers } from "../../helpers/miniDb";

import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";
import { messages } from "../../../localization";

const stealVipMessages = messages.pubSubClient.actions.stealVip;

async function stealVip(msg: RedemptionMessage): Promise<RedemptionMessage> {
  if (!msg.message) {
    throw new Error("Redemption has no message");
  }

  const channelId = parseInt(msg.channelId);
  const channel = await getUsernameFromId(channelId);

  if (!channel) {
    throw new Error("No channel found");
  }

  const addVipUser = msg.userDisplayName;
  const removeVipUser = msg.message.toLowerCase();
  let channelVips = vipUsers[channelId];

  if (!channelVips) {
    channelVips = [];
    vipUsers[channelId] = channelVips;
  }

  if (!channelVips.find((u) => u.toLowerCase() === removeVipUser)) {
    const noVips = 0;
    const hasVips = channelVips.length > noVips;

    const message = !hasVips
      ? stealVipMessages.noVipUsers
      : stealVipMessages.allowedUsers(channelVips.sort());
    await say(channel, message);

    if (!hasVips) {
      throw new Error("No VIP users to steal from");
    }
  }

  if (channelVips.includes(addVipUser) || (await hasVip(channel, addVipUser))) {
    throw new Error(`@${addVipUser} is already VIP`);
  }

  const removed = await removeVip(channel, removeVipUser);

  if (!removed && (await hasVip(channel, removeVipUser))) {
    throw new Error(`Could not remove VIP of @${removeVipUser}`);
  }

  const added = await addVip(channel, addVipUser);

  if (!added) {
    await addVip(channel, removeVipUser);

    throw new Error(`Could not add VIP to ${addVipUser}`);
  }

  const removeIdx = channelVips.findIndex(
    (u) => u.toLowerCase() === removeVipUser
  );

  channelVips.splice(removeIdx);
  channelVips.push(addVipUser);
  save();

  if (msg.message) {
    msg.message = stealVipMessages.message(addVipUser, removeVipUser);
  }

  await say(channel, msg.message);

  return msg;
}

export { stealVip };
