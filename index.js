import { RefreshableAuthProvider, StaticAuthProvider } from "twitch-auth";

import { ApiClient } from "twitch";
import { ChatClient } from "twitch-chat-client";
import { PubSubClient } from "twitch-pubsub-client";
import WebSocket  from "ws";
import express from "express";
import { promises as fs } from "fs";
import path from "path";

const TOKENS_FILE = "./tokens.json";
const SCHEDULED_FILE = "./scheduled.json";
const DEV_MODE = process.argv.includes("--dev");

const scheduledActions = [];
let saInterval;

const channel = "alexbcberio";

let apiClient;
let chatClient;

//! Important: store users & channels by id, not by username

async function init() {
  let tokenData;
  try {
      tokenData = JSON.parse(await fs.readFile(TOKENS_FILE));
  } catch (error) {
    console.error(`${TOKENS_FILE} not found, cannot init chatbot.`);
    process.exit(1);
  }

  if (
      !tokenData.refresh_token ||
      !tokenData.access_token
  ) {
      console.error(`Missing parameters in ${TOKENS_FILE}, refresh_token or access_token.`);
      process.exit(1);
  }

  const authProvider = new RefreshableAuthProvider(
      new StaticAuthProvider(process.env.TWITCH_CLIENT_ID, tokenData.access_token), {
          clientSecret: process.env.TWITCH_CLIENT_SECRET,
          refreshToken: tokenData.refresh_token,
          expiry: tokenData.expiryTimestamp === null ? null : new Date(tokenData.expiryTimestamp),
          onRefresh: async ({ accessToken, refreshToken, expiryDate }) => {
              console.log("Tokens refreshed");
              const newTokenData = {
                  access_token: accessToken,
                  refresh_token: refreshToken,
                  expiryTimestamp: expiryDate === null ? null : expiryDate.getTime()
              };
              await fs.writeFile(TOKENS_FILE, JSON.stringify(newTokenData));
          }
      }
  );

  apiClient = new ApiClient({ authProvider });

  const pubSubClient = new PubSubClient();
  const userId = await pubSubClient.registerUserListener(apiClient, channel);
  /*const listener = */await pubSubClient.onRedemption(userId, onRedemption);

  console.log("[Twitch PubSub] Connected & registered");

  chatClient = new ChatClient(authProvider, { channels: [channel] });

  chatClient.onConnect(async () => {
    console.log("[ChatClient] Connected");

    // *Check this, not working
    if (!saInterval) {
      let savedActions = [];
      try {
        savedActions = JSON.parse(await fs.readFile(SCHEDULED_FILE));
      } catch (e) {
        // probably file does not exist
      }
      scheduledActions.push.apply(scheduledActions, savedActions);
      scheduledActions.sort((a, b) => a.scheduledAt - b.scheduledAt);

      setTimeout(checkScheduledActions, 1000 * 5);
      saInterval = setInterval(checkScheduledActions, 1000 * 60);
    }
  });

  chatClient.onDisconnect(e => {
    console.log(`[ChatClient] Disconnected ${e.message}`);
  });

  chatClient.onNoPermission((channel, message) => {
    console.log(`[ChatClient] No permission on ${channel}: ${message}`);
  });

  chatClient.connect();
}

init();

async function onRedemption(message) {
  console.log(`Reward: "${message.rewardName}" (${message.rewardId}) redeemed by ${message.userDisplayName}`);
  const reward = message._data.data.redemption.reward;

  let msg = {
    id: message.id,
    channelId: message.channelId,
    rewardId: message.rewardId,
    rewardName: message.rewardName,
    rewardImage: message.rewardImage ? message.rewardImage.url_4x : "https://static-cdn.jtvnw.net/custom-reward-images/default-4.png",
    message: message.message,
    userDisplayName: message.userDisplayName,
    // non directly available values from PubSubRedemptionMessage
    backgroundColor: reward.background_color
  };

  switch(msg.rewardId) {
    // robar vip
    case "ac750bd6-fb4c-4259-b06d-56953601243b":
      msg = await stealVip(msg);
      break;
  }

  if (msg) {
    broadcast(msg);
  }
}

const app = express();
const wsServer = new WebSocket.Server({
  noServer: true
});

let sockets = [];
wsServer.on("connection", (socket, req) => {
  console.log(`[WS] ${req.socket.remoteAddress} New connection established`);
  sockets.push(socket);
  socket.send(JSON.stringify({
    env: DEV_MODE ? "dev" : "prod"
  }));

  socket.on("message", async (msg) => {
    const data = JSON.parse(msg);

    // broadcast message
    if (!data.actions || data.actions.length === 0) {
      sockets
        .filter(s => s !== socket)
        .forEach(s => s.send(msg));
      return;
    }

    for (const action of data.actions) {
      if (!action.scheduledAt) {
        await handleClientAction(action);

      } else {
        scheduledActions.push(action);
        scheduledActions.sort((a, b) => a.scheduledAt - b.scheduledAt);
        saveScheduledActions();
      }
    }

    console.log(`[WS] Received message with ${data.actions.length} actions:`, data);
  });

  socket.on("close", () => {
    sockets = sockets.filter(s => s !== socket);
    console.log("[WS] Connection closed");
  });
});

async function handleClientAction(action) {

  if (action.channel && !isNaN(action.channel)) {
    action.channel = await getUsernameFromId(parseInt(action.channel));
  }
  if (action.username && !isNaN(action.username)) {
    action.username = await getUsernameFromId(parseInt(action.username));
  }

  switch(action.action) {
    case "say":
      say(channel, action.message);
      break;
    case "timeout":
      await timeout(channel, action.username, action.time, action.reason);
      break;
    case "broadcast":
      broadcast(action.message);
      break;
    case "addVip":
      await addVip(action.channel, action.username);
      break;
    case "removeVip":
      await removeVip(action.channel, action.username);
      break;
    default:
      console.log(`Couldn't handle action:`, action);
  }
}

let ssaTimeout;
function saveScheduledActions() {
  if (ssaTimeout) {
    clearTimeout(ssaTimeout);
    ssaTimeout = null;
    console.log("[Scheduled] Removed save timeout.");
  }

  ssaTimeout = setTimeout(async () => {
    await fs.writeFile(SCHEDULED_FILE, JSON.stringify(scheduledActions));
    console.log("[Scheduled] Saved actions.");
    ssaTimeout = null;
  }, 1000 * 30);
}

let checkingScheduled = false;
async function checkScheduledActions() {
  if (checkingScheduled) return;
  checkingScheduled = true;

  let hasToSave = false;

  for (let i = 0; i < scheduledActions.length && scheduledActions[i].scheduledAt <= Date.now(); i++) {
    hasToSave = true;

    const action = scheduledActions.splice(i, 1)[0];
    await handleClientAction(action);
    console.log(`[Scheduled] Executed: ${JSON.stringify(action)}`);
  }

  if (hasToSave) {
    saveScheduledActions();
  }

  checkingScheduled = false;
}

// send a chat message
function say(channel, message) {
  chatClient.say(channel, message);
}

// timeouts a user in a channel
async function timeout(channel, username, time, reason) {
  if (!time) {
    time = 60;
  }

  if (!reason) {
    reason = "";
  }

  try {
    await chatClient.timeout(channel, username, time, reason);
  } catch (e) {
    // user cannot be timed out
  }
}

// broadcast a message to all clients
function broadcast(msg) {
  sockets.forEach(s => s.send(JSON.stringify(msg)));
}

// adds a user to vips
async function addVip(channel, username, message) {
  if (!message) {
    message = `Otorgado VIP a @${username}.`;
  }

  await chatClient.addVip(channel, username);
  say(channel, message);
}

async function hasVip(channel, username) {
  if (!username) {
    return false;
  }

  const vips = await chatClient.getVips(channel);
  return vips.includes(username);
}

// removes a user from vips
async function removeVip(channel, username, message) {
  if (!message) {
    message = `Se ha acabado el chollo, VIP de @${username} eliminado.`;
  }

  await chatClient.removeVip(channel, username);
  say(channel, message);
}

async function getUsernameFromId(userId) {
  const user = await apiClient.helix.users.getUserById(userId);

  if (!user) {
    return null;
  }

  return user.displayName;
}

// remove vip from a user to grant it to yourself
async function stealVip(msg) {
  const channel = await getUsernameFromId(parseInt(msg.channelId));
  const addVipUser = msg.userDisplayName;
  const removeVipUser = msg.message;

  if (await hasVip(channel, removeVipUser)) {
    await removeVip(channel, removeVipUser);
    await addVip(channel, addVipUser);

    const scheduledRemoveVipIndex = scheduledActions.findIndex(s => s.action === "removeVip" && s.username === removeVipUser);

    if (scheduledRemoveVipIndex > -1) {
      scheduledActions[scheduledRemoveVipIndex].username = addVipUser;
      saveScheduledActions();
    }

    msg.message = `@${addVipUser} ha robado el VIP a @${removeVipUser}.`;

    return msg;
  }

  return null;
}

/*
  Webserver
 */
const server = app.listen(!DEV_MODE ? 8080 : 8081, '0.0.0.0');

server.on("listening", () => {
  console.log(`[Webserver] Listening on port ${server.address().port}`);
});

server.on("upgrade", (req, socket, head) => {
  wsServer.handleUpgrade(req, socket, head, socket => {
    wsServer.emit("connection", socket, req);
  });
});

app.get("*", async (req, res) => {
  try {
    let rpath = req.path;

    if (rpath.endsWith("/")) {
      rpath += "index.html";
    }

    res.sendFile(path.join(process.cwd(), "client", rpath));
  } catch (e) {
    res.sendStatus(404);
  }
});