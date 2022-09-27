import { broadcast, wsHandler } from "./ws";
import {
  createServer,
  startServer,
  staticFileStream,
  staticPath,
} from "./common";

import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";

async function start(): Promise<void> {
  const server = createServer();

  await server.register(fastifyWebsocket);

  await server.register(fastifyStatic, {
    root: staticPath,
  });

  server.route({
    method: "GET",
    url: "/",
    wsHandler,
    handler(_req, reply) {
      reply.type("text/html").send(staticFileStream("index.html"));
    },
  });

  startServer(server);
}

export { start, broadcast };
