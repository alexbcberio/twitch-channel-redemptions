import { FastifyInstance, FastifyRequest } from "fastify";

import { ParamsType } from "..";
import { getRedemptionActions } from "../../../../../../actions";

export default function (server: FastifyInstance) {
  server.route({
    method: "GET",
    url: "/",
    async handler(req: FastifyRequest<{ Params: ParamsType }>, reply) {
      const rewardId = req.params.id;

      const actions = await getRedemptionActions(rewardId);

      return reply.send(JSON.stringify({ actions }));
    },
  });

  return Promise.resolve();
}
