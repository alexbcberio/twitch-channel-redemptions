import { FastifyInstance, FastifyRequest } from "fastify";

import { ParamsType } from "..";
import { getRedemptions } from "../../../../../../eventSubClient/events/channelPointsCustomRewardRedemptionAdd";

export default function (server: FastifyInstance) {
  server.route({
    method: "GET",
    url: "/",
    async handler(req: FastifyRequest<{ Params: ParamsType }>, reply) {
      const rewardId = req.params.id;

      const redemptions = await getRedemptions();
      let actions = redemptions[rewardId];

      if (!Array.isArray(actions)) {
        actions = [];
      }

      return reply.send(JSON.stringify({ actions }));
    },
  });

  return Promise.resolve();
}
