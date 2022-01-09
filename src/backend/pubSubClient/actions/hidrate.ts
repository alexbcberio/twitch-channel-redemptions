import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";
import { messages } from "../../../localization";
import { say } from "../../chatClient";

const hidrateMessages = messages.pubSubClient.actions.hidrate;

async function hidrate(msg: RedemptionMessage): Promise<RedemptionMessage> {
  const channel = await getUsernameFromId(parseInt(msg.channelId));

  if (!channel) {
    throw new Error("No channel found");
  }

  msg.message = hidrateMessages.message(msg.userDisplayName);

  await say(channel, hidrateMessages.chatMessage);

  return msg;
}

export { hidrate };
