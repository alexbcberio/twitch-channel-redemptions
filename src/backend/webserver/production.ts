import { createServer, startServer, staticPath } from "./common";

import { broadcast } from "./routes/ws";
import { fastifyAutoload } from "@fastify/autoload";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import { join } from "path";

async function start(): Promise<void> {
  const server = createServer();

  await server.register(fastifyWebsocket);

  await server.register(fastifyStatic, {
    root: staticPath,
  });

  await server.register(fastifyAutoload, {
    dir: join(__dirname, "routes"),
    routeParams: true,
  });

  startServer(server);
}

export { start, broadcast };
