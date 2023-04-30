import { FastifyInstance } from "fastify";
import { staticFileStream } from "../../common";

export default function (server: FastifyInstance) {
  server.route({
    method: "GET",
    url: "/",
    handler(_req, reply) {
      reply.type("text/html").send(staticFileStream("overlay.html"));
    },
  });

  return Promise.resolve();
}
