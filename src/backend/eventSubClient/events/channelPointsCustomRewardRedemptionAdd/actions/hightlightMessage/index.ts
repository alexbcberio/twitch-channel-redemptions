import { extendLogger, warning } from "../../../../../helpers/log";

import { RedemptionMessage } from "../../../../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../../../../helpers/twitch";
import { messages } from "../../../../../../localization";
import { timeout } from "../../../../../chatClient/clientActions";

const namespace = "PubSub:HighlightMessage";
const log = extendLogger(namespace);

const highlightMessageMessages = messages.pubSubClient.actions.highlightMessage;

async function highlightMessage(
  msg: RedemptionMessage
): Promise<RedemptionMessage> {
  if (!msg.message) {
    throw new Error("Redemption has no message");
  }

  const urlRegex =
    /(https?:\/\/)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;

  if (urlRegex.test(msg.message)) {
    log("Message contains a url");
    const channel = await getUsernameFromId(parseInt(msg.channelId));

    // this should never happen
    if (!channel) {
      throw new Error("No channel found");
    }

    try {
      const reason = highlightMessageMessages.noLinksAllowed;
      const timeoutSeconds = 10;

      await timeout(channel, msg.userDisplayName, timeoutSeconds, reason);
    } catch (e) {
      warning(
        "[%s] Username %s cannot be timed out in %s channel",
        namespace,
        msg.userDisplayName,
        channel
      );
    }

    throw new Error("The message cannot contain a url");
  }

  return msg;
}

export { highlightMessage };
