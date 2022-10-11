import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../../helpers/twitch";
import { messages } from "../../../../localization";
import { msText } from "../../../helpers/util";
import { timeout } from "../../../chatClient/clientActions";

const timeoutFriendMessages = messages.pubSubClient.actions.timeoutFriend;

async function timeoutFriend(
  msg: RedemptionMessage
): Promise<RedemptionMessage> {
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

  // eslint-disable-next-line require-atomic-updates
  msg.message = timeoutFriendMessages.message(
    userDisplayName,
    message,
    msText(time * msPerSecond)
  );

  return msg;
}

export { timeoutFriend };
