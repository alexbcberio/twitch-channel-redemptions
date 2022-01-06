import { sayError, saySuccess } from "../clientActions";

import { LOG_PREFIX } from "..";
import { TwitchPrivateMessage } from "@twurple/chat/lib/commands/TwitchPrivateMessage";
import { createReward as createChannelPointsReward } from "../../helpers/twitch";

async function createReward(
  channel: string,
  _user: string,
  message: string,
  msg: TwitchPrivateMessage
): Promise<void> {
  const args = message.split(" ");

  const title = args.shift();

  if (!title) {
    await sayError(channel, "Debes indicar el título de la recompensa");
    return;
  }

  const minRewardPrice = 1;
  const cost = Math.max(minRewardPrice, parseInt(args.shift() ?? "0"));

  try {
    await createChannelPointsReward(msg.channelId as string, {
      title,
      cost,
    });

    saySuccess(
      channel,
      `Creada recompensa de canal "${title}" con un costo de ${cost}`
    );
  } catch (e) {
    if (e instanceof Error) {
      console.log(`${LOG_PREFIX}${e.message}`);
    }
  }
}

export { createReward };
