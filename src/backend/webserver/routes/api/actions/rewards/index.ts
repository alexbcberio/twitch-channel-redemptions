import { FastifyInstance } from "fastify";
import { RedemptionType } from "../../../../../../enums/RedemptionType";

export default function (server: FastifyInstance) {
  server.route({
    method: "GET",
    url: "/",
    handler(_req, reply) {
      reply.send({ actionTypes: Object.values(RedemptionType).sort() });
    },
  });

  return Promise.resolve();
}
