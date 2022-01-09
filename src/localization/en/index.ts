import { Messages } from "..";
import { es } from "../es";

const fallbackMessages = es;

const en: Messages = {
  chatClient: {
    commands: {
      createReward: {
        missingTitle: "You must set a title for the reward",
        rewardCreated(title: string, cost: number) {
          return `Created "${title}" reward with a cost of ${cost}`;
        },
      },
    },
    availableCommands(names: Array<string>) {
      return `Available commands: "${names.join('", "')}"`;
    },
    addedVip(username: string) {
      return `Assigned VIP to @${username}`;
    },
    removeVip(username: string) {
      return `Removed VIP from @${username}`;
    },
  },
  helpers: {
    util: {
      msText: {
        second: ["second", "seconds"],
        minute: ["minute", "minutes"],
      },
    },
  },
  pubSubClient: {
    actions: {
      lightTheme: {
        message: `Enjoy this shiny day!`,
        messageTimeIncreased(duration: string) {
          return `Increased time with light theme by ${duration}`;
        },
        cumulatedTime(cumulated: string) {
          return `(${cumulated} cumulated)`;
        },
      },
      hidrate: {
        message(username: string) {
          return `@${username} has invited you to a round`;
        },
        chatMessage: fallbackMessages.pubSubClient.actions.hidrate.chatMessage,
      },
      highlightMessage: {
        noLinksAllowed: "Links are not allowed on highlighted messages",
      },
      russianRoulette: {
        timeoutReason: "F in roulette",
        survivedMessage(username: string) {
          return `PepeHands ${username} has not survived to tell the tale`;
        },
        gotShotMessage(username: string) {
          return fallbackMessages.pubSubClient.actions.russianRoulette.gotShotMessage(
            username
          );
        },
      },
      stealVip: {
        noVipUsers: "There is no one you can steal the VIP",
        allowedUsers(users: Array<string>) {
          return `You can only steal VIP from: "${users.join('", "')}"`;
        },
        message(addVipUser: string, removeVipUser: string) {
          return `@${addVipUser} has "borrowed" the VIP from @${removeVipUser}`;
        },
      },
      timeoutFriend: {
        timeoutReason(username: string) {
          return `Timeout given by @${username} with channel points`;
        },
        message(username: string, timedOutUser: string, timeAmount: string) {
          return `@${username} has timed out @${timedOutUser} by ${timeAmount}`;
        },
      },
    },
  },
};

export { en };
