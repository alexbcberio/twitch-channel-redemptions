import {
  createCard,
  karaokeTime,
  russianRoulette,
  snow,
} from "./events/redemption";

import { GlobalAction } from "../../interfaces/actions/global";
import { RedemptionAction } from "../../interfaces/actions/redemption";
import { RedemptionType } from "../../enums/RedemptionType";
import { Song } from "../../interfaces/Song";
import { sleep } from "./helpers/sleep";
import { updateSong } from "./events/updateSong";

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

const events = new Array<RedemptionAction | GlobalAction>();

async function processQueue() {
  do {
    // eslint-disable-next-line no-magic-numbers
    const data = events[0];

    switch (data.type) {
      case RedemptionType.CreateCard:
        await createCard(data.title, data.message, data.hexColor, data.image);
        break;
      case RedemptionType.KaraokeTime:
        await karaokeTime(data.username);
        break;
      case RedemptionType.RussianRoulette:
        await russianRoulette(data.userDisplayName, Boolean(data.gotShot));
        break;
      case RedemptionType.Snow:
        snow();
        break;
      default:
        // @ts-ignore warn unhandled event types
        console.warn(`Unhandled event type "%s"`, data.type);
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
  } else if (!message.events) {
    return;
  }

  // eslint-disable-next-line no-magic-numbers
  const emptyEventList = events.length === 0;

  events.push(...message.events);

  if (!emptyEventList) {
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
