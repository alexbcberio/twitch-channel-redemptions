import { AddressInfo, Socket } from "net";
import { IncomingMessage, Server } from "http";
import { save, scheduledActions } from "./miniDb";

import { Action } from "../../interfaces/actions/Action";
import WebSocket from "ws";
import express from "express";
import { handleClientAction } from "../chatClient";
import { isDevelopment } from "./util";
import { join } from "path";

const LOG_PREFIX_HTTP = "[HTTP] ";
const LOG_PREFIX_WS = "[WS] ";

const app = express();
const sockets: Array<WebSocket> = [];

const wsServer = new WebSocket.Server({
  noServer: true,
});

let server: Server;

function broadcast(msg: string, socket?: WebSocket) {
  const filteredSockets = socket
    ? sockets.filter((s) => s !== socket)
    : sockets;

  filteredSockets.forEach((s) => s.send(msg));
}

async function onMessage(this: WebSocket, msg: string) {
  const data = JSON.parse(msg);

  if (!data.actions) {
    broadcast(msg, this);
    return;
  }

  const actions: Array<Action> = data.actions;

  for (const action of actions) {
    if (!action.scheduledAt) {
      await handleClientAction(action);
    } else {
      scheduledActions.push(action);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scheduledActions.sort((a: any, b: any) => a.scheduledAt - b.scheduledAt);
      save();
    }
  }

  console.log(
    `${LOG_PREFIX_WS}Received message with ${data.actions.length} actions:`,
    data
  );
}

function onClose(this: WebSocket) {
  const socketIdx = sockets.indexOf(this);
  const deleteCount = 1;

  sockets.splice(socketIdx, deleteCount);
  console.log(`${LOG_PREFIX_WS}Connection closed`);
}

function onListening() {
  console.log(
    `${LOG_PREFIX_HTTP}Listening on port ${
      (server.address() as AddressInfo).port
    }`
  );
}

function onUpgrade(req: IncomingMessage, socket: Socket, head: Buffer) {
  wsServer.handleUpgrade(req, socket, head, (socket) => {
    wsServer.emit("connection", socket, req);
  });
}

function onConnection(socket: WebSocket, req: IncomingMessage) {
  console.log(
    `${LOG_PREFIX_WS}${req.socket.remoteAddress} New connection established`
  );
  sockets.push(socket);
  socket.send(
    JSON.stringify({
      env: isDevelopment ? "dev" : "prod",
    })
  );

  socket.on("message", onMessage);
  socket.on("close", onClose);
}

wsServer.on("connection", onConnection);

app.use(express.static(join(process.cwd(), "client")));

function listen() {
  if (server) {
    console.log(`${LOG_PREFIX_HTTP}Server is already running`);
    return;
  }

  let port = 8080;

  if (isDevelopment) {
    port++;
  }

  server = app.listen(port, "0.0.0.0");

  server.on("listening", onListening);
  server.on("upgrade", onUpgrade);
}

export { listen, broadcast };
