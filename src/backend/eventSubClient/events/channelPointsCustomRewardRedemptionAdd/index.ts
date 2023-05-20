import {
  ChannelPointsCustomRewardRedemptionAddEvent,
  NotificationMessage,
} from "../../../../interfaces/events/eventSub";
import {
  completeRewards,
  getApiClient,
} from "../../../helpers/twitch";
import { error, extendLogger } from "../../../helpers/log";
import {
  redemptionActionsByRewardId,
  redemptionHandlersFromRewardId,
} from "../../../actions";

import { GlobalAction } from "../../../../interfaces/actions/global";
import { RedemptionAction } from "../../../../interfaces/actions/redemption";
import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../../../enums/RedemptionType";
import { broadcast } from "../../../webserver";
import { isProduction } from "../../../helpers/util";

const namespace = `events:ChannelPointsCustomRewardRedemptionAdd`;
const log = extendLogger(namespace);

function keepInQueue(rewardId: string): boolean {
  return redemptionActionsByRewardId(rewardId).includes(
    RedemptionType.KaraokeTime
  );
}

function updatableReward(
  rewardEvent: ChannelPointsCustomRewardRedemptionAddEvent
): boolean {
  if (
    rewardEvent.status === "unfulfilled" &&
    keepInQueue(rewardEvent.reward.id)
  ) {
    log("Reward kept in queue due to config");

    return false;
  }

  return true;
}

async function cancelReward(
  rewardEvent: ChannelPointsCustomRewardRedemptionAddEvent
): Promise<void> {
  if (!updatableReward(rewardEvent)) {
    return;
  }

  try {
    await cancelRewards(
      rewardEvent.broadcaster_user_id,
      rewardEvent.reward.id,
      rewardEvent.id
    );
    log("Reward removed from queue (canceled)");
  } catch (e) {
    if (e instanceof Error) {
      error("[%s] %s", namespace, e.message);
    }
  }
}

async function completeReward(
  rewardEvent: ChannelPointsCustomRewardRedemptionAddEvent
): Promise<void> {
  if (!updatableReward(rewardEvent)) {
    return;
  }

  try {
    await completeRewards(
      rewardEvent.broadcaster_user_id,
      rewardEvent.reward.id,
      rewardEvent.id
    );
    log("Reward removed from queue (completed)");
  } catch (e) {
    if (e instanceof Error) {
      error("[%s] %s", namespace, e.message);
    }
  }
}

async function handle(
  notification: NotificationMessage<ChannelPointsCustomRewardRedemptionAddEvent>
) {
  const apiClient = await getApiClient();
  const { event } = notification.payload;
  const rewardId = event.reward.id;
  const reward = await apiClient.channelPoints.getCustomRewardById(
    event.broadcaster_user_id,
    rewardId
  );

  log(
    'Reward: "%s" (%s) redeemed by %s',
    event.reward.title,
    event.reward.id,
    event.user_login
  );

  if (!reward) {
    error(
      '[%s] Internal error, could not get "%d" reward details.',
      namespace,
      rewardId
    );
    return;
  }

  const rewardsType = redemptionActionsByRewardId(reward.id);
  const redemptionHandlers = redemptionHandlersFromRewardId(reward.id);

  const clientActions = new Array<RedemptionAction | GlobalAction>();

  for (let i = 0; i < rewardsType.length; i++) {
    const rewardType = rewardsType[i];
    const redemptionHandler = redemptionHandlers[i];

    const msg: RedemptionMessage = {
      id: event.id,
      channelId: event.broadcaster_user_id,
      rewardId: reward.id,
      rewardType,
      rewardName: reward.title,
      // eslint-disable-next-line no-magic-numbers
      rewardImage: reward.getImageUrl(4),
      rewardCost: reward.cost,
      message: event.user_input,
      userId: event.user_id,
      userDisplayName: event.user_name,
      backgroundColor: reward.backgroundColor,
    };

    try {
      const handledMessage = await redemptionHandler(msg);

      clientActions.push(handledMessage);
    } catch (e) {
      if (e instanceof Error) {
        error("[%s] %s", namespace, e.message);
      }

      await cancelReward(event);

      return;
    }
  }

  broadcast(JSON.stringify({ events: clientActions }));

  if (isProduction) {
    await completeReward(event);
  } else {
    await cancelReward(event);
  }
}

export { handle };
