import { FastifyInstance } from "fastify";
import { staticFileStream } from "../common";
import { wsHandler } from "./ws";

export default function (server: FastifyInstance) {
  server.route({
    method: "GET",
    url: "/",
    wsHandler,
    handler(_req, reply) {
      reply.type("text/html").send(staticFileStream("index.html"));
    },
  });

  return Promise.resolve();
}
