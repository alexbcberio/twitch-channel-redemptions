import { FastifyInstance } from "fastify";
import { wsHandler } from "./ws";

export default function (server: FastifyInstance) {
  server.route({
    method: "GET",
    url: "/",
    wsHandler,
  });

  return Promise.resolve();
}
