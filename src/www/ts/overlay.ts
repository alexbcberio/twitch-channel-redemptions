import {
  createCard,
  karaokeTime,
  russianRoulette,
  snow,
  updateSong,
} from "./events/redemption";

import { RedemptionMessage } from "../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../enums/RedemptionType";
import { Song } from "../../interfaces/Song";
import { sleep } from "./helpers/sleep";

let ws: WebSocket;
let env: "dev" | "prod";

function reconnect() {
  const reconnectTimeout = 5e3;

  console.log(`Reconnecting in ${reconnectTimeout}ms`);

  if (env === "dev") {
    setTimeout(async () => {
      try {
        await fetch(location.href);

        location.reload();
      } catch (e) {
        setTimeout(reconnect);
      }
    }, reconnectTimeout);
    return;
  }

  // eslint-disable-next-line no-use-before-define
  setTimeout(init, reconnectTimeout);
}

const events = new Array<RedemptionMessage>();

async function processQueue() {
  do {
    // eslint-disable-next-line no-magic-numbers
    const data = events[0];

    if (!data.message) {
      data.message = "";
    }

    if (data.channelId) {
      switch (data.rewardType) {
        case RedemptionType.KaraokeTime:
          await karaokeTime(data.userDisplayName, data.message);
          break;
        case RedemptionType.RussianRoulette:
          await russianRoulette(data);
          break;
        case RedemptionType.Snow:
          snow();
          break;
        default:
          await createCard(
            data.rewardName,
            data.message,
            data.backgroundColor,
            data.rewardImage
          );
      }
    }

    events.shift();
    await sleep(500);
    // eslint-disable-next-line no-magic-numbers
  } while (events.length > 0);
}

async function checkEvent(this: WebSocket, e: MessageEvent) {
  if (!env) {
    env = JSON.parse(e.data).env.toLowerCase();

    return;
  }

  if (env === "dev") {
    console.log(e.data);
  }

  const message = JSON.parse(e.data);

  if (message.song) {
    const song: Song = message;
    updateSong(song);
    return;
  } else if (!message.rewardId) {
    return;
  }

  events.push(message);

  // eslint-disable-next-line no-magic-numbers
  if (events.length > 1) {
    return;
  }

  await processQueue();
}

function init() {
  ws = new WebSocket(
    `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
  );

  ws.onopen = () => {
    console.log("Connected");

    ws.onmessage = checkEvent;
  };
  ws.onclose = reconnect;
}

document.addEventListener("DOMContentLoaded", init);
