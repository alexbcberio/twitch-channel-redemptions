import { extendLogger, info } from "./log";
import fastify, { FastifyReply, FastifyRequest } from "fastify";
import fastifyWebsocket, { SocketStream } from "@fastify/websocket";
import { save, scheduledActions } from "../helpers/miniDb";

import { Action } from "../../interfaces/actions/Action";
import { createReadStream } from "fs";
import fastifyStatic from "@fastify/static";
import { handleClientAction } from "../chatClient";
import { isDevelopment } from "../helpers/util";
import { join } from "path";

const namespaceHttp = "HTTP";
// const logHttp = extendLogger(namespaceHttp);
const namespaceWs = "WS";
const logWs = extendLogger(namespaceWs);

const staticPath = join(process.cwd(), "dist/www");

type WebSocket = SocketStream["socket"];

const server = fastify();
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

function handler(_req: FastifyRequest, reply: FastifyReply) {
  const filePath = join(staticPath, "index.html");
  const readStream = createReadStream(filePath);

  reply.type("text/html").send(readStream);
}

async function listen(): Promise<void> {
  await server.register(fastifyWebsocket);

  await server.register(fastifyStatic, {
    root: staticPath,
  });

  server.route({
    method: "GET",
    url: "/",
    wsHandler,
    handler,
  });

  let port = 8080;

  if (isDevelopment) {
    port++;
  }

  return new Promise((res, rej) => {
    server.listen(port, "0.0.0.0", (err) => {
      if (err) {
        rej(err);
        return;
      }

      info("[%s] Listening on port %d", namespaceHttp, port);
      res();
    });
  });
}

export { listen, broadcast };
