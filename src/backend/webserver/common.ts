import { ReadStream, createReadStream } from "fs";
import { extendLogger, info } from "../helpers/log";
import fastify, { FastifyInstance } from "fastify";

import { isDevelopment } from "../helpers/util";
import { join } from "path";

const namespaceHttp = "HTTP";
const logHttp = extendLogger(namespaceHttp);

const staticPath = join(process.cwd(), "dist/www");

function createServer(): FastifyInstance {
  const server = fastify();

  return server;
}

function startServer(server: FastifyInstance): Promise<void> {
  let port = 8080;

  if (isDevelopment) {
    port++;
  }

  return new Promise((res, rej) => {
    server.listen(
      {
        host: "0.0.0.0",
        port,
      },
      (err) => {
        if (err) {
          rej(err);
          return;
        }

        info("[%s] Listening on port %d", namespaceHttp, port);
        res();
      }
    );
  });
}

function staticFileStream(file: string): ReadStream {
  const filePath = join(staticPath, file);

  return createReadStream(filePath);
}

export { staticPath, logHttp, createServer, startServer, staticFileStream };
