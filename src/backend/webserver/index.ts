import { broadcast, wsHandler } from "./ws";
import fastify, { FastifyReply, FastifyRequest } from "fastify";

import { createReadStream } from "fs";
import fastifyStatic from "@fastify/static";
import fastifyWebsocket from "@fastify/websocket";
import { info } from "../helpers/log";
import { isDevelopment } from "../helpers/util";
import { join } from "path";

const namespaceHttp = "HTTP";
// const logHttp = extendLogger(namespaceHttp);

const staticPath = join(process.cwd(), "dist/www");

const server = fastify();

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
