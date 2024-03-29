import * as WebSocket from "ws";

import {
  EventSubMessage,
  KeepaliveMessage,
  NotificationMessage,
  ReconnectMessage,
  RevocationMessage,
  WelcomeMessage,
} from "../../interfaces/events/eventSub";
import {
  availableSubscriptionTypesWithScope,
  getApiClient,
} from "../helpers/twitch";
import { error, extendLogger, warning } from "../helpers/log";

import { ApiClient } from "@twurple/api";
import { SubscriptionTypeV1 as SubscriptionType } from "../../enums/EventSub";
import { handleNotification } from "./events";

const namespace = "EventSubClient";
const wsServer = "wss://eventsub.wss.twitch.tv/ws";

const log = extendLogger(namespace);

let apiClient: ApiClient;
let ws: WebSocket;
let isReconnect = false;
let userId: string;

function createSubscription(
  type: string,
  version: string,
  condition: Record<string, unknown>,
  sessionId: string
) {
  return apiClient.eventSub.createSubscription(type, version, condition, {
    method: "websocket",
    session_id: sessionId,
  });
}

async function createSubscriptionV1(
  type: string,
  condition: Record<string, unknown>,
  sessionId: string
) {
  await createSubscription(type, "1", condition, sessionId);

  log('Subscribed to "%s" v1 event', type);
}

async function createSubscriptionV2(
  type: string,
  condition: Record<string, unknown>,
  sessionId: string
) {
  await createSubscription(type, "2", condition, sessionId);

  log('Subscribed to "%s" v2 event', type);
}

function subscribeToEvents(
  subscriptionTypes: Array<SubscriptionType>,
  sessionId: string
) {
  const subscriptions = new Array<Promise<void>>();

  for (let i = 0; i < subscriptionTypes.length; i++) {
    const subscriptionType = subscriptionTypes[i];

    switch (subscriptionType) {
      case SubscriptionType.ChannelFollow:
        subscriptions.push(
          createSubscriptionV2(
            subscriptionType,
            {
              broadcaster_user_id: userId,
              moderator_user_id: userId,
            },
            sessionId
          )
        );
        break;
      case SubscriptionType.StreamOnline:
      case SubscriptionType.ChannelSubscribe:
      case SubscriptionType.ChannelSubscriptionEnd:
      case SubscriptionType.ChannelSubscriptionGift:
      case SubscriptionType.ChannelSubscriptionMessage:
      case SubscriptionType.ChannelCheer:
      case SubscriptionType.StreamOffline:
      case SubscriptionType.ChannelBan:
      case SubscriptionType.ChannelUnban:
      case SubscriptionType.ChannelModeratorAdd:
      case SubscriptionType.ChannelModeratorRemove:
      case SubscriptionType.ChannelChannelPointsCustomRewardAdd:
      case SubscriptionType.ChannelChannelPointsCustomRewardUpdate:
      case SubscriptionType.ChannelChannelPointsCustomRewardRemove:
      case SubscriptionType.ChannelChannelPointsCustomRewardRedemptionAdd:
      case SubscriptionType.ChannelChannelPointsCustomRewardRedemptionUpdate:
      case SubscriptionType.ChannelPollBegin:
      case SubscriptionType.ChannelPollProgress:
      case SubscriptionType.ChannelPollEnd:
      case SubscriptionType.ChannelPredictionBegin:
      case SubscriptionType.ChannelPredictionProgress:
      case SubscriptionType.ChannelPredictionLock:
      case SubscriptionType.ChannelPredictionEnd:
      case SubscriptionType.ChannelHypeTrainBegin:
      case SubscriptionType.ChannelHypeTrainProgress:
      case SubscriptionType.ChannelHypeTrainEnd:
      case SubscriptionType.ChannelGoalBegin:
      case SubscriptionType.ChannelGoalProgress:
      case SubscriptionType.ChannelGoalEnd:
        subscriptions.push(
          createSubscriptionV1(
            subscriptionType,
            {
              broadcaster_user_id: userId,
            },
            sessionId
          )
        );
        break;
      case SubscriptionType.ChannelRaid:
        subscriptions.push(
          createSubscriptionV1(
            subscriptionType,
            {
              to_broadcaster_user_id: userId,
            },
            sessionId
          )
        );
        break;
      default:
        warning(
          '[%s] Unhandled subscription type "%s"',
          namespace,
          subscriptionType
        );
        break;
    }
  }

  return Promise.allSettled(subscriptions);
}

async function subscribeToAllAvailableEvents(sessionId: string) {
  const tokenInfo = await apiClient.getTokenInfo();
  const subscriptionTypes = availableSubscriptionTypesWithScope(
    // @ts-expect-error lib types do not match
    tokenInfo.scopes
  );

  const results = await subscribeToEvents(subscriptionTypes, sessionId);

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      error(
        '[%s] Error subscribing to event "%s" with reason: %s',
        namespace,
        subscriptionTypes[i],
        result.reason
      );
    }
  }
}
function isWelcomeMessage(message: EventSubMessage): message is WelcomeMessage {
  return message.metadata.message_type === "session_welcome";
}

function isKeepaliveMessage(
  message: EventSubMessage
): message is KeepaliveMessage {
  return message.metadata.message_type === "session_keepalive";
}

function isNotificationMessage(
  message: EventSubMessage
): message is NotificationMessage<unknown> {
  return message.metadata.message_type === "notification";
}

function isReconnectMessage(
  message: EventSubMessage
): message is ReconnectMessage {
  return message.metadata.message_type === "session_reconnect";
}

function isRevocationMessage(
  message: EventSubMessage
): message is RevocationMessage {
  return message.metadata.message_type === "revocation";
}

function onOpen(this: WebSocket) {
  log("[%s] Connection opened", namespace);
}

function onMessage(this: WebSocket, data: WebSocket.RawData) {
  const message: EventSubMessage = JSON.parse(data.toString());

  if (isWelcomeMessage(message)) {
    log("[%s] Received session welcome", namespace);

    if (!isReconnect) {
      subscribeToAllAvailableEvents(message.payload.session.id);
    }
  } else if (isKeepaliveMessage(message)) {
    // TODO: handle alive, restart if no keepalive message received
  } else if (isNotificationMessage(message)) {
    handleNotification(message);
  } else if (isReconnectMessage(message)) {
    ws.close();
    setImmediate(() => {
      // eslint-disable-next-line no-use-before-define
      connect(message.payload.session.reconnect_url);
    });
  } else if (isRevocationMessage(message)) {
    const { type, status } = message.payload.subscription;
    log('[%s] Revocated "%s" subscription with reason "%s"', type, status);
  } else {
    log(
      '[%s] Unhandled message type "%s"',
      namespace,
      // @ts-expect-error just in case there is a new message type
      message.metadata.message_type
    );
  }
}

function onClose(this: WebSocket, code: number, reason: Buffer) {
  log(
    '[%s] Connection closed with code %d and reason "%s"',
    namespace,
    code,
    reason
  );

  // eslint-disable-next-line no-use-before-define
  setImmediate(connect);
}

function connect(reconnectUrl?: string) {
  isReconnect = typeof reconnectUrl === "string";
  const url = typeof reconnectUrl === "string" ? reconnectUrl : wsServer;

  if (isReconnect) {
    log("[%s] Reconnecting to %s", namespace, url);
  }

  ws = new WebSocket(url);
  ws.on("open", onOpen);
  ws.on("message", onMessage);
  ws.on("close", onClose);
}

async function registerUserListener(username: string) {
  apiClient = await getApiClient();
  const user = await apiClient.users.getUserByName(username);

  if (!user) {
    log(`username ${username} not found`);
    return;
  }

  userId = user.id;
  connect();
}

export { registerUserListener, namespace };
