import { save, scheduledActions } from "../../helpers/miniDb";

import { Action } from "../../../interfaces/actions/server/Action";
import { FastifyRequest } from "fastify";
import { SocketStream } from "@fastify/websocket";
import { extendLogger } from "../../helpers/log";
import { handleClientAction } from "../../chatClient";
import { isDevelopment } from "../../helpers/util";

type WebSocket = SocketStream["socket"];

const namespaceWs = "WS";
const logWs = extendLogger(namespaceWs);

const sockets = new Set<WebSocket>();

function broadcast(msg: string, socket?: WebSocket) {
  sockets.forEach((s) => {
    if (s !== socket) {
      s.send(msg);
    }
  });
}

async function onMessage(this: WebSocket, rawMsg: Buffer) {
  const msg = rawMsg.toString();
  const data = JSON.parse(msg);

  if (!data.actions) {
    broadcast(msg, this);
    return;
  }

  const actions: Array<Action> = data.actions;

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (!action.scheduledAt) {
      await handleClientAction(action);
    } else {
      scheduledActions.push(action);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      scheduledActions.sort((a: any, b: any) => a.scheduledAt - b.scheduledAt);

      save();
    }
  }

  logWs("Received message with %d actions: %O", data.actions.length, data);
}

function onClose(this: WebSocket) {
  sockets.delete(this);
  logWs("Connection closed");
}

function wsHandler(con: SocketStream, req: FastifyRequest) {
  const { socket } = con;

  logWs("%s New connection established", req.ip);

  sockets.add(socket);

  socket.send(JSON.stringify({ env: isDevelopment ? "dev" : "prod" }));

  socket.on("message", onMessage);
  socket.on("close", onClose);
}

export { wsHandler, broadcast };
