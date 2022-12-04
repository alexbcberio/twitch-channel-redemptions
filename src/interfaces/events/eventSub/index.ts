import { SubscriptionTypeV1 as SubscriptionType } from "../../../enums/EventSub";

interface WelcomeMessage {
  metadata: {
    message_id: string;
    message_type: "session_welcome";
    message_timestamp: string;
  };
  payload: {
    session: {
      id: string;
      status: "connected";
      connected_at: string;
      keepalive_timeout_seconds: number;
      reconnect_url: string | null;
    };
  };
}

interface KeepaliveMessage {
  metadata: {
    message_id: string;
    message_type: "session_keepalive";
    message_timestamp: string;
  };
  payload: Record<never, never>;
}

interface NotificationMessage<T> {
  metadata: {
    message_id: string;
    message_type: "notification";
    message_timestamp: string;
    subscription_type: SubscriptionType;
    subscription_version: string;
  };
  payload: {
    subscription: {
      id: string;
      status: "enabled";
      type: SubscriptionType;
      version: string;
      cost: string;
      condition: Record<string, unknown>;
      transport: {
        method: "websocket";
        session_id: string;
      };
      created_at: string;
    };
    event: T;
  };
}

interface ReconnectMessage {
  metadata: {
    message_id: string;
    message_type: "session_reconnect";
    message_timestamp: string;
  };
  payload: {
    session: {
      id: string;
      status: "reconnecting";
      keepalive_timeout_seconds: null;
      reconnect_url: string;
      connected_at: string;
    };
  };
}

interface RevocationMessage {
  metadata: {
    message_id: string;
    message_type: "revocation";
    message_timestamp: string;
    subscription_type: "channel.follow";
    subscription_version: "1";
  };
  payload: {
    subscription: {
      id: string;
      status: "user_removed" | "authorization_revoked" | "version_removed";
      type: SubscriptionType;
      version: "1";
      cost: number;
      condition: Record<string, unknown>;
      transport: {
        method: "websocket";
        session_id: string;
      };
      created_at: string;
    };
  };
}

type EventSubMessage =
  | WelcomeMessage
  | KeepaliveMessage
  | NotificationMessage<unknown>
  | ReconnectMessage
  | RevocationMessage;

interface BaseEvent {
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  user_id: string;
  user_login: string;
  user_name: string;
}

interface ChannelPointsCustomRewardRedemptionAddEvent extends BaseEvent {
  id: string;
  user_input: string;
  status: "unfulfilled" | "fulfilled" | "canceled";
  reward: {
    id: string;
    title: string;
    cost: number;
    prompt: string;
  };
  redeemed_at: string;
}

interface ChannelSubscribeEvent extends BaseEvent {
  tier: "1000" | "2000" | "3000";
  is_gift: boolean;
}

interface ChannelFollowEvent {
  user_id: string;
  user_login: string;
  user_name: string;
  broadcaster_user_id: string;
  broadcaster_user_login: string;
  broadcaster_user_name: string;
  followed_at: string;
}

type EventSubEvent =
  | ChannelFollowEvent
  | ChannelPointsCustomRewardRedemptionAddEvent
  | ChannelSubscribeEvent;

export {
  ChannelFollowEvent,
  ChannelPointsCustomRewardRedemptionAddEvent,
  ChannelSubscribeEvent,
  EventSubEvent,
  EventSubMessage,
  KeepaliveMessage,
  NotificationMessage,
  ReconnectMessage,
  RevocationMessage,
  WelcomeMessage,
};
