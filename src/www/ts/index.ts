import { RedemptionMessage } from "../../interfaces/RedemptionMessage";
import { Song } from "../../interfaces/Song";
import { createCard } from "./actions/createCard";
import { karaokeTime } from "./actions/karaokeTime";
import { russianRoulette } from "./actions/russianRoulette";
import { updateSong } from "./actions/updateSong";
import { waitTime } from "./helpers/waitTime";

let ws: WebSocket;
let env: "dev" | "prod";

function reconnect() {
  if (env === "dev") {
    location.reload();
  }

  const reconnectSeconds = 5;
  const msPerSecond = 1e3;

  console.log(`Reconnecting in ${reconnectSeconds} seconds...`);
  // eslint-disable-next-line no-use-before-define
  setTimeout(init, reconnectSeconds * msPerSecond);
}

const events: Array<RedemptionMessage> = [];

async function checkEvent(this: WebSocket, e: MessageEvent) {
  if (!env) {
    env = JSON.parse(e.data).env.toLowerCase();

    return;
  }

  const message = JSON.parse(e.data);

  if (message.song) {
    const song: Song = message;
    updateSong(song);
    return;
  }

  events.push(message);

  // eslint-disable-next-line no-magic-numbers
  if (events.length === 1) {
    do {
      // eslint-disable-next-line no-magic-numbers
      const data = events[0];

      if (!data.message) {
        data.message = "";
      }

      if (data.channelId) {
        switch (data.rewardId) {
          case "KaraokeTime":
            await karaokeTime(data.userDisplayName, data.message);
            break;
          case "RussianRoulette":
            await russianRoulette(data);
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
      await waitTime();
      // eslint-disable-next-line no-magic-numbers
    } while (events.length > 0);
  }

  if (env === "dev") {
    console.log(e.data);
  }
}

// TODO: Check git history and give it some use
// function sendWsActions(actions: Array<Action>) {
//   if (!Array.isArray(actions)) {
//     actions = [actions];
//   }

//   if (env === "dev") {
//     console.log("Dev mode, actions not sent: ", actions);
//     return;
//   }

//   if (ws.readyState === WebSocket.OPEN) {
//     if (actions.length > 0) {
//       ws.send(
//         JSON.stringify({
//           actions,
//         })
//       );
//     }
//   }
// }

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
