import { LOG_PREFIX } from "..";
import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";
import { timeout } from "../../chatClient/clientActions";

async function highlightMessage(
  msg: RedemptionMessage
): Promise<RedemptionMessage> {
  if (!msg.message) {
    throw new Error("Redemption has no message");
  }

  const urlRegex =
    /(https?:\/\/)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;

  if (urlRegex.test(msg.message)) {
    console.log(`${LOG_PREFIX}Message contains a url`);
    const channel = await getUsernameFromId(parseInt(msg.channelId));

    if (!channel) {
      throw new Error("No channel found");
    }

    try {
      const reason = "No se permite enviar enlaces en mensajes destacados";
      const timeoutSeconds = 10;

      await timeout(channel, msg.userDisplayName, timeoutSeconds, reason);
    } catch (e) {
      // user probably cannot be timed out
    }

    throw new Error("The message cannot contain a url");
  }

  return msg;
}

export { highlightMessage };
