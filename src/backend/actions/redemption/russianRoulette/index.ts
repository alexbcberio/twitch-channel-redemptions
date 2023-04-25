import { say, timeout } from "../../../chatClient/clientActions";

import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../../../enums/RedemptionType";
import { RussianRoulette } from "../../../../interfaces/actions/redemption";
import { getUsernameFromId } from "../../../helpers/twitch";
import { messages } from "../../../../localization";
import { randomInt } from "crypto";

type GunsSafeShots = Record<string, number>;
const gunsSafeShots: GunsSafeShots = {};

const timeoutSeconds = 60;
const maxSafeShots = 5;

const russianRouletteMessages = messages.pubSubClient.actions.russianRoulette;

async function russianRoulette(
  msg: RedemptionMessage
): Promise<RussianRoulette> {
  const channel = await getUsernameFromId(parseInt(msg.channelId));
  const { channelId, userDisplayName } = msg;

  if (!channel) {
    throw new Error("No channel found");
  }

  const noShots = 0;

  if (gunsSafeShots[channelId] === noShots) {
    gunsSafeShots[channelId] = maxSafeShots;
  }

  const gotShot =
    gunsSafeShots[channelId] > noShots &&
    // eslint-disable-next-line no-magic-numbers
    randomInt(gunsSafeShots[channelId]-- + 1) !== 0;

  if (gunsSafeShots[channelId] < noShots || !gotShot) {
    gunsSafeShots[channelId] = maxSafeShots;
  }

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

  return {
    type: RedemptionType.RussianRoulette,
    userDisplayName: msg.userDisplayName,
    gotShot,
  };
}

export { russianRoulette };
