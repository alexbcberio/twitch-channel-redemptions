document.addEventListener("DOMContentLoaded", init);

let ws;
let env;

function init() {
  ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`);

  ws.onopen = () => {
    console.log("Connected");

    ws.onmessage = checkEvent;
  }
  ws.onclose = reconnect;
}

function reconnect() {
  // !TEMP: only for development mode
  if (env === "dev") {
    location.reload();
  }
  console.log("Reconnecting in 5 seconds...");
  setTimeout(init, 5000);
}

const events = [];
let handlingEvents = false;

async function checkEvent(e) {
  if (!env) {
    env = JSON.parse(e.data).env.toLowerCase();

    return;
  }

  const message = JSON.parse(e.data);

  if (message.song) {
    updateSong(message.song)
    return;
  }

  events.push(message);

  if (events.length === 1) {
    do {
      const data = events[0];

      if (data.channelId) {
        switch (data.rewardId) {
          // karaoke time
          case "27faa7e4-f496-4e91-92ae-a51f99b9e854":
            await karaokeTime(data.userDisplayName, data.message);
            break;
          // ruleta rusa
          case "a73247ee-e33e-4e9b-9105-bd9d11e111fc":
            await russianRoulette(data.userDisplayName);
            break;
          // timeout a un amigo
          case "638c642d-23d8-4264-9702-e77eeba134de":
            await timeoutFriend(data);
            break;
          // highlight message
          case "a26c0d9e-fd2c-4943-bc94-c5c2f2c974e4":
            await highlightMessage(data);
            break;
          case "a215d6a0-2c11-4503-bb29-1ca98ef046ac":
            await giveTempVip(data);
            data.message = `@${data.userDisplayName} ha encontrado diamantes!`;
            await createCard(data.rewardName, data.message, data.backgroundColor, data.rewardImage);
            break;
          // robar el vip
          case "ac750bd6-fb4c-4259-b06d-56953601243b":
            await createCard(data.rewardName, data.message, data.backgroundColor, data.rewardImage);
            break;
           // hidratate
          case "232e951f-93d1-4138-a0e3-9e822b4852e0":
            data.message = `@${data.userDisplayName} ha invitado a una ronda.`;
            sendWsActions({
              action: "say",
              message: "FunnyCatTastingTHEWATER FunnyCatTastingTHEWATER FunnyCatTastingTHEWATER"
            });
            await createCard(data.rewardName, data.message, data.backgroundColor, data.rewardImage);
            break;
          default:
            await createCard(data.rewardName, data.message ? data.message : "", data.backgroundColor, data.rewardImage);
        }
      }

      events.shift();
      await waitTime();

    } while (events.length > 0);
  }

  console.log(e.data);
}

function waitTime() {
  const WAIT_TIME_MS = 500;

  return new Promise(res => {
    setTimeout(res, WAIT_TIME_MS);
  });
}

function karaokeTime(username, message) {
  return new Promise(res => {
    console.log(username, message);

    const div = document.createElement("div");
    div.classList.add("alert");

    const lightLeft = document.createElement("div");
    lightLeft.classList.add("light", "light-left");
    div.appendChild(lightLeft);

    const lightRight = document.createElement("div");
    lightRight.classList.add("light", "light-right");
    div.appendChild(lightRight);

    const randomLeft = tinycolor.random().setAlpha(.45).saturate(100).toRgbString();
    const randomRight = tinycolor(randomLeft).spin(Math.floor(Math.random() * 90) + 90).toRgbString();

    insertCssVariables({
      "--light-color-left": randomLeft,
      "--light-color-right": randomRight
    });

    const img = createImg("/img/karaoke-time.png");
    const p = createText(`${username} ha sugerido cantar un tema`);

    div.appendChild(img);
    div.appendChild(p);
    img.onload = () => {
      const audio = createAudio("/sfx/karaoke-time.mp3");

      audio.onended = function() {
        div.remove();
        res();
      }

      document.body.appendChild(div);
      audio.play();
    };
  });

}

let rrAttemps = 0;
function russianRoulette(username) {
  return new Promise(res =>  {
    const win = rando(5 - rrAttemps) !== 0;

    const div = document.createElement("div");
    div.classList.add("alert");
    div.style.margin = ".5rem";

    const img = createImg("/img/toy-gun.png");

    const p = createText();

    if (win) {
      p.innerText = `${username} ha sido afortunado y aún sigue entre nosotros`;
      rrAttemps = 0;
    } else {
      p.innerText = `${username} se ha ido a un mundo mejor, siempre te recordaremos`;
      rrAttemps++;
    }

    div.appendChild(img);
    div.appendChild(p);

    img.onload = () => {
      const audio = createAudio(`/sfx/toy-gun/${win ? 'stuck' : 'shot'}.mp3`);

      document.body.appendChild(div);

      const actions = [];
      if (!win) {
        img.classList.add("shoot");

        actions.push({
          action: "timeout",
          username: username,
          time: "60",
          reason: "F en la ruleta."
        });

        actions.push({
          action: "say",
          message: `PepeHands ${username} no ha sobrevivido para contarlo.`
        });

      } else {
        actions.push({
          action: "say",
          message: `rdCool Clap ${username}`
        });
      }

      if (actions.length > 0) {
        sendWsActions(actions);
      }

      audio.onended = () => {
        setTimeout(() => {
          div.remove();
          res();
        }, 1250);
      }

      audio.play();
    }
  });
}

async function timeoutFriend(data) {
  const senderUser = data.userDisplayName;
  const receptorUser = data.message.split(" ")[0];

  sendWsActions({
    action: "timeout",
    username: receptorUser,
    time: "60",
    reason: `Timeout dado por @${senderUser} con puntos del canal.`
  });

  const cardMessage = `@${senderUser} ha expulsado a @${receptorUser} por 60 segundos.`;
  await createCard(data.rewardName, cardMessage, data.backgroundColor, data.rewardImage);
}

async function highlightMessage(data) {
  const urlRegex = /(https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

  if (urlRegex.test(data.message)) {
    sendWsActions({
      action: "timeout",
      username: data.userDisplayName,
      time: "10",
      reason: "No esta permitido enviar enlaces en mensajes destacados."
    });
    return;
  }

  await createCard(data.rewardName, data.message, data.backgroundColor, data.rewardImage);
}

async function giveTempVip(data) {
  const username = data.userDisplayName;
  const channel = data.channelId;

  sendWsActions([{
      action: "addVip",
      channel,
      username
    }, {
      scheduledAt: Date.now() + 1000 * 60 * 60 * 24 * 7,
      action: "removeVip",
      channel,
      username
    }]);
}

// send actions to be performed by the server
function sendWsActions(actions) {
  if (!Array.isArray(actions)) {
    actions = [actions];
  }

  if (env === "dev") {
    console.log("Dev mode, actions not sent: ", actions);
    return;
  }

  if (ws.readyState === WebSocket.OPEN) {

    if (actions.length > 0) {
      ws.send(JSON.stringify({
        actions: actions
      }));
    }

  }
}

function createCard(title, message, color, image) {
  const maxMessageLength = 120;
  const darkenLighten = 10;

  return new Promise(res => {
    const card = document.createElement("div");
    card.classList.add("card", "open");

    const img = createImg(image);
    img.classList.add("card-image");
    card.appendChild(img);

    const body = document.createElement("div");
    body.classList.add("card-body");
    card.appendChild(body);

    const titl = document.createElement("h1");
    titl.classList.add("title");
    titl.innerText = title;
    body.appendChild(titl);

    if (message.length > maxMessageLength) {
      while (message.length > maxMessageLength) {
        message = message.split(" ").slice(0, -1).join(" ");
      }
      message += "...";
    }

    const msg = createText(message);
    msg.classList.add("message");
    body.appendChild(msg);

    color = tinycolor(color);

    if (!color.isValid()) {
      color = tinycolor("#2EC90C");
    }

    let backgroundColor = color;
    let borderColor = new tinycolor(backgroundColor.toHexString());

    if (backgroundColor.isLight()) {
      card.classList.add("card-light");
      borderColor.darken(darkenLighten).toHexString();

    } else {
      borderColor.lighten(darkenLighten).toHexString();
    }

    insertCssVariables({
      "--card-background-color": backgroundColor.toHexString(),
      "--card-border-color": borderColor.toHexString()
    });

    card.addEventListener("animationend", () => {
      if (card.classList.contains("open")) {
        card.classList.remove("open");

        const fairTime = message.split(" ").length / 5;
        const timeOpen = Math.min(Math.max(fairTime, 4), 8);

        setTimeout(() => {
          card.classList.add("close");
        }, timeOpen * 1000);

      } else {
        card.remove();
        res();
      }
    });

    img.onload = () => {
      document.body.appendChild(card);
    };
  });
}

// creates a img and sets its src
function createImg(path) {
  const img = document.createElement("img");
  img.src = path;
  return img;
}

// creates a paragraph and sets a text inside
function createText(txt) {
  const p = document.createElement("p");

  if (txt) {
    p.innerText = txt;
  }

  return p;
}

// creates and initializes an audio element with given audio src
function createAudio(path) {
  const audio = new Audio(path);
  audio.volume = .025;

  return audio;
}

// get a internal style sheet or create it if it does not exist, used to set css variables on :root
function cssSheet() {
  const targetValue = "cssVariables";
  let style = document.querySelector(`style[data-target="${targetValue}"]`);

  if (style) {
    return style.sheet;
  }

  style = document.createElement("style");
  style.setAttribute("data-target", targetValue);
  document.head.appendChild(style);

  return style.sheet;
}

// add css rules to :root element
function insertCssVariables(rules) {
  const sheet = cssSheet();

  while (sheet.rules.length > 0) {
    sheet.deleteRule(0);
  }

  let rulesTxt = ":root {";
  for (const name in rules) {
    rulesTxt += `${name}: ${rules[name]};`;
  }
  rulesTxt += "}";

  sheet.insertRule(rulesTxt);
}

// playing song overlay
function updateSong({ title, artist, coverArt}) {
  const playing = document.getElementById("playing");
  if (
    !title &&
    !artist
  ) {
    playing.style.display = "none";
    return;
  }

  playing.style.display = null;
  playing.querySelector(".coverArt").src = coverArt;
  playing.querySelector(".trackName").innerText = title;
  playing.querySelector(".trackArtist").innerText = artist;
}