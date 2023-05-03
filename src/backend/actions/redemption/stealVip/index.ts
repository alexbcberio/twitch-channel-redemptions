import {
  addVip,
  getUserIdFromUsername,
  getUsernameFromId,
  hasVip,
  removeVip,
} from "../../../helpers/twitch";
import { save, vipUsers } from "../../../helpers/miniDb";

import { CreateCard } from "../../../../interfaces/actions/redemption";
import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../../../enums/RedemptionType";
import { messages } from "../../../../localization";
import { say } from "../../../chatClient/clientActions";

const stealVipMessages = messages.pubSubClient.actions.stealVip;

async function stealVip(msg: RedemptionMessage): Promise<CreateCard> {
  if (!msg.message) {
    throw new Error("Redemption has no message");
  }

  const channelId = msg.channelId;
  const channel = await getUsernameFromId(parseInt(channelId));

  if (!channel) {
    throw new Error("No channel found");
  }

  const addVipUser = msg.userDisplayName;
  const addVipUserId = msg.userId;
  const removeVipUser = msg.message.toLowerCase();
  const removeVipUserId = await getUserIdFromUsername(removeVipUser);

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

  if (!removeVipUserId) {
    throw new Error(`Username @${removeVipUser} does not exist`);
  }

  if (
    channelVips.includes(addVipUser) ||
    (await hasVip(channelId, addVipUserId))
  ) {
    throw new Error(`@${addVipUser} is already VIP`);
  }

  const removed = await removeVip(channelId, removeVipUserId);

  if (!removed && (await hasVip(channelId, removeVipUserId))) {
    throw new Error(`Could not remove VIP of @${removeVipUser}`);
  }

  const added = await addVip(channelId, addVipUserId);

  if (!added) {
    await addVip(channelId, removeVipUserId);

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

  return {
    type: RedemptionType.CreateCard,
    title: msg.rewardName,
    image: msg.rewardImage,
    hexColor: msg.backgroundColor,
    message: msg.message,
  };
}

export { stealVip };
