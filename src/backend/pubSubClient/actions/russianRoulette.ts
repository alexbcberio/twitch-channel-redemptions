import { say, timeout } from "../../chatClient/clientActions";

import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";
import { randomInt } from "crypto";

type GunsSafeShots = Record<string, number>;
const gunsSafeShots: GunsSafeShots = {};

const timeoutSeconds = 60;
const maxSafeShots = 5;

async function russianRoulette(
  msg: RedemptionMessage
): Promise<RedemptionMessage> {
  const { channelId, userDisplayName } = msg;
  const channel = await getUsernameFromId(parseInt(channelId));

  if (!channel) {
    throw new Error("No channel found");
  }

  if (!gunsSafeShots[channelId]) {
    gunsSafeShots[channelId] = maxSafeShots;
  }

  const noShots = 0;

  const win =
    gunsSafeShots[channelId] > noShots &&
    // eslint-disable-next-line no-magic-numbers
    randomInt(gunsSafeShots[channelId]-- + 1) !== 0;

  if (gunsSafeShots[channelId] < noShots || !win) {
    gunsSafeShots[channelId] = maxSafeShots;
  }

  // eslint-disable-next-line require-atomic-updates
  msg.message = win ? "" : "got shot";

  if (!win) {
    await timeout(channel, userDisplayName, timeoutSeconds, "F en la ruleta");

    await say(
      channel,
      `PepeHands ${userDisplayName} no ha sobrevivido para contarlo`
    );
  } else {
    await say(channel, `rdCool Clap ${userDisplayName}`);
  }

  return msg;
}

export { russianRoulette };
