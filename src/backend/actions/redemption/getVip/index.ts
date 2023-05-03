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

const MAX_VIPS = 3;

async function getVip(msg: RedemptionMessage): Promise<CreateCard> {
  const channelId = msg.channelId;
  const channel = await getUsernameFromId(parseInt(channelId));

  if (!channel) {
    throw new Error("No channel found");
  }

  const addVipUser = msg.userDisplayName;
  const addVipUserId = msg.userId;

  if (await hasVip(channelId, addVipUserId)) {
    throw new Error(`@${addVipUser} is already VIP`);
  }

  let users = vipUsers[channelId];

  if (!users) {
    users = [];
    vipUsers[channelId] = users;
  }

  if (users.length >= MAX_VIPS) {
    const user = users.shift();

    if (!user) {
      throw new Error(`Cannot obtain oldest VIP from database`);
    }

    const userId = await getUserIdFromUsername(user);

    if (!userId) {
      throw new Error(`Username @${user} does no longer exist`);
    }

    await removeVip(channelId, userId);
  }

  await addVip(channelId, addVipUserId);

  users.push(addVipUser);
  save();

  return {
    type: RedemptionType.CreateCard,
    title: msg.rewardName,
    image: msg.rewardImage,
    hexColor: msg.backgroundColor,
    message: `@${addVipUser} ha canjeado VIP en el canal`,
  };
}

export { getVip };
