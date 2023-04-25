import { addVip, hasVip, removeVip } from "../../../chatClient/clientActions";
import { save, vipUsers } from "../../../helpers/miniDb";

import { CreateCard } from "../../../../interfaces/actions/redemption";
import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../../../enums/RedemptionType";
import { getUsernameFromId } from "../../../helpers/twitch";

const MAX_VIPS = 3;

async function getVip(msg: RedemptionMessage): Promise<CreateCard> {
  const channelId = parseInt(msg.channelId);
  const channel = await getUsernameFromId(channelId);

  if (!channel) {
    throw new Error("No channel found");
  }

  const addVipUser = msg.userDisplayName;

  if (await hasVip(channel, addVipUser)) {
    throw new Error(`@${addVipUser} is already VIP`);
  }

  let users = vipUsers[channelId];

  if (!users) {
    users = [];
    vipUsers[channelId] = users;
  }

  if (users.length >= MAX_VIPS) {
    const user = users.shift();

    if (user) {
      await removeVip(channel, user);
    }
  }

  await addVip(channel, addVipUser);

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
