import { say, timeout } from "../../chatClient/clientActions";

import { RedemptionMessage } from "../../../interfaces/RedemptionMessage";
import { getUsernameFromId } from "../../helpers/twitch";
import { messages } from "../../../localization";
import { randomInt } from "crypto";

type GunsSafeShots = Record<string, number>;
const gunsSafeShots: GunsSafeShots = {};

const timeoutSeconds = 60;
const maxSafeShots = 5;

const russianRouletteMessages = messages.pubSubClient.actions.russianRoulette;

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

  const gotShot =
    gunsSafeShots[channelId] > noShots &&
    // eslint-disable-next-line no-magic-numbers
    randomInt(gunsSafeShots[channelId]-- + 1) !== 0;

  if (gunsSafeShots[channelId] < noShots || !gotShot) {
    gunsSafeShots[channelId] = maxSafeShots;
  }

  // eslint-disable-next-line require-atomic-updates
  msg.message = gotShot ? "got shot" : "";

  if (gotShot) {
    try {
      await timeout(
        channel,
        userDisplayName,
        timeoutSeconds,
        russianRouletteMessages.timeoutReason
      );
    } catch (e) {
      // user cannot be timed out
    }

    await say(channel, russianRouletteMessages.gotShotMessage(userDisplayName));
  } else {
    await say(
      channel,
      russianRouletteMessages.survivedMessage(userDisplayName)
    );
  }

  return msg;
}

export { russianRoulette };
