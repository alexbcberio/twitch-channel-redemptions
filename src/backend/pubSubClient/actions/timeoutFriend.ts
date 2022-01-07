import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";
import { timeout } from "../../chatClient/clientActions";

async function timeoutFriend(
  msg: RedemptionMessage
): Promise<RedemptionMessage> {
  const { message, channelId, userDisplayName } = msg;
  if (!msg.message) {
    throw new Error("Redemption has no message");
  }

  const channel = await getUsernameFromId(parseInt(channelId));

  if (!channel) {
    throw new Error("No channel found");
  }

  const time = 60;
  const reason = `Timeout dado por @${userDisplayName} con puntos del canal`;

  await timeout(channel, msg.message, time, reason);

  // eslint-disable-next-line require-atomic-updates
  msg.message = `@${userDisplayName} ha expulsado a @${message} por ${time} segundos`;

  return msg;
}

export { timeoutFriend };
