import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";
import { say } from "../../chatClient";

async function hidrate(msg: RedemptionMessage): Promise<RedemptionMessage> {
  const channel = await getUsernameFromId(parseInt(msg.channelId));

  if (!channel) {
    throw new Error("No channel found");
  }

  msg.message = `@${msg.userDisplayName} ha invitado a una ronda`;

  await say(channel, "waterGang waterGang waterGang");

  return msg;
}

export { hidrate };
