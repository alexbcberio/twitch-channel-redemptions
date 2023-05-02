import {
  ChannelPointsCustomRewardRedemptionAddEvent,
  NotificationMessage,
} from "../../../interfaces/events/eventSub";

import { SubscriptionTypeV1 as SubscriptionType } from "../../../enums/EventSub";
import { handle as channelPointsCustomRewardRedemptionAdd } from "./channelPointsCustomRewardRedemptionAdd";
import { log } from "../../chatClient";
import { namespace } from "..";

const notifications = new Array<NotificationMessage<unknown>>();
let clearNotificationsTimeout: NodeJS.Timeout | null;

function hasNotificationExpired(
  notification: NotificationMessage<unknown>
): boolean {
  // eslint-disable-next-line no-magic-numbers
  const expireTime = 10 * 60e3;
  const timeDiff =
    Date.now() - new Date(notification.metadata.message_timestamp).getTime();

  return timeDiff > expireTime;
}

function clearOldNotifications() {
  // eslint-disable-next-line no-magic-numbers
  while (notifications.length > 0 && hasNotificationExpired(notifications[0])) {
    notifications.shift();
  }

  clearNotificationsTimeout = null;
}

function isDuplicateNotification(
  notification: NotificationMessage<unknown>
): boolean {
  const messageId = notification.metadata.message_id;
  const messageTimestamp = new Date(
    notification.metadata.message_timestamp
  ).getTime();

  let isDuplicated = false;
  let lowerTimestamp = true;

  for (
    let i = 0;
    i < notifications.length && !isDuplicated && lowerTimestamp;
    i++
  ) {
    const { message_id, message_timestamp } = notifications[i].metadata;
    isDuplicated = message_id === messageId;
    lowerTimestamp = new Date(message_timestamp).getTime() < messageTimestamp;
  }

  notifications.push(notification);

  if (!clearNotificationsTimeout) {
    const ms = 60e3;
    clearNotificationsTimeout = setTimeout(clearOldNotifications, ms);
  }

  return isDuplicated;
}

function isChannelChannelPointsCustomRewardRedemptionAdd(
  notification: NotificationMessage<unknown>
): notification is NotificationMessage<ChannelPointsCustomRewardRedemptionAddEvent> {
  return (
    notification.metadata.subscription_type ===
    SubscriptionType.ChannelChannelPointsCustomRewardRedemptionAdd
  );
}

function handleNotification(notification: NotificationMessage<unknown>) {
  if (
    hasNotificationExpired(notification) ||
    isDuplicateNotification(notification)
  ) {
    return;
  }

  if (isChannelChannelPointsCustomRewardRedemptionAdd(notification)) {
    channelPointsCustomRewardRedemptionAdd(notification);
  } else {
    log(
      "[%s] Handle %s event",
      namespace,
      notification.metadata.subscription_type
    );
  }
}

export { handleNotification };
