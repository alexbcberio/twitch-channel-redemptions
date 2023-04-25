import { CreateCard } from "../../../../interfaces/actions/redemption";
import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../../../enums/RedemptionType";
import { getUsernameFromId } from "../../../helpers/twitch";
import { messages } from "../../../../localization";
import { say } from "../../../chatClient/clientActions";

const hidrateMessages = messages.pubSubClient.actions.hidrate;

async function hidrate(msg: RedemptionMessage): Promise<CreateCard> {
  const channel = await getUsernameFromId(parseInt(msg.channelId));

  if (!channel) {
    throw new Error("No channel found");
  }

  await say(channel, hidrateMessages.chatMessage);

  return {
    type: RedemptionType.CreateCard,
    title: msg.rewardName,
    image: msg.rewardImage,
    hexColor: msg.backgroundColor,
    message: hidrateMessages.message(msg.userDisplayName),
  };
}

export { hidrate };
