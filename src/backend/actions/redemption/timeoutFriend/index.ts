import { getUsernameFromId, timeout } from "../../../helpers/twitch";

import { CreateCard } from "../../../../interfaces/actions/redemption";
import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../../../enums/RedemptionType";
import { messages } from "../../../../localization";
import { msText } from "../../../helpers/util";

const timeoutFriendMessages = messages.pubSubClient.actions.timeoutFriend;

async function timeoutFriend(msg: RedemptionMessage): Promise<CreateCard> {
  const { message, channelId, userDisplayName } = msg;

  if (!message) {
    throw new Error("Redemption has no message");
  }

  const channel = await getUsernameFromId(parseInt(channelId));

  if (!channel) {
    throw new Error("No channel found");
  }

  const time = 60;
  const reason = timeoutFriendMessages.timeoutReason(userDisplayName);

  await timeout(channel, message, time, reason);

  const msPerSecond = 1e3;

  if (msg.message) {
    msg.message = timeoutFriendMessages.message(
      userDisplayName,
      message,
      msText(time * msPerSecond)
    );
  }

  return {
    type: RedemptionType.CreateCard,
    title: msg.rewardName,
    image: msg.rewardImage,
    hexColor: msg.backgroundColor,
    message: msg.message ?? "",
  };
}

export { timeoutFriend };
