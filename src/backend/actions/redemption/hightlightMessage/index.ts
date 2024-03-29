import { extendLogger, warning } from "../../../helpers/log";
import { getUsernameFromId, timeout } from "../../../helpers/twitch";

import { CreateCard } from "../../../../interfaces/actions/redemption";
import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../../../enums/RedemptionType";
import { messages } from "../../../../localization";

const namespace = "PubSub:HighlightMessage";
const log = extendLogger(namespace);

const highlightMessageMessages = messages.pubSubClient.actions.highlightMessage;

async function highlightMessage(msg: RedemptionMessage): Promise<CreateCard> {
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

      await timeout(msg.channelId, msg.userId, timeoutSeconds, reason);
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

  return {
    type: RedemptionType.CreateCard,
    title: msg.rewardName,
    image: msg.rewardImage,
    hexColor: msg.backgroundColor,
    message: msg.message,
  };
}

export { highlightMessage };
