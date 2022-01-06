import { addVip, hasVip, removeVip, say } from "../../chatClient/clientActions";
import { save, vipUsers } from "../../helpers/miniDb";

import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";

// remove vip from a user to grant it to yourself
async function stealVip(
  msg: RedemptionMessage
): Promise<RedemptionMessage | undefined> {
  if (!msg.message) {
    console.log(`${LOG_PREFIX}Redemption has no message`);

    return;
  }

  const channelId = parseInt(msg.channelId);
  const channel = await getUsernameFromId(channelId);

  if (!channel) {
    console.log(`${LOG_PREFIX}No channel found`);

    return;
  }

  const addVipUser = msg.userDisplayName;
  const removeVipUser = msg.message.toLowerCase();
  const channelVips = vipUsers[channelId];

  if (!channelVips.find((u) => u.toLowerCase() === removeVipUser)) {
    const message =
      // eslint-disable-next-line no-magic-numbers
      channelVips.length === 0
        ? "No hay nadie a quien puedas robar el VIP"
        : `Solo puedes robar el VIP de: "${channelVips.sort().join('", "')}"`;
    await say(channel, message);

    return;
  }

  if (channelVips.includes(addVipUser) || (await hasVip(channel, addVipUser))) {
    console.log(`${LOG_PREFIX}@${addVipUser} is already VIP`);

    return;
  }

  const removed = await removeVip(channel, removeVipUser);

  if (!removed && (await hasVip(channel, removeVipUser))) {
    console.log(`${LOG_PREFIX}Could not remove VIP of @${removeVipUser}`);
    return;
  }

  const added = await addVip(channel, addVipUser);

  if (!added) {
    await addVip(channel, removeVipUser);

    return;
  }

  const removeIdx = channelVips.findIndex(
    (u) => u.toLowerCase() === removeVipUser
  );

  channelVips.splice(removeIdx);
  channelVips.push(addVipUser);
  save();

  // eslint-disable-next-line require-atomic-updates
  msg.message = `@${addVipUser} ha "tomado prestado" el VIP de @${removeVipUser}`;

  await say(channel, msg.message);

  return msg;
}

export { stealVip };
