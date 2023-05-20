import { FastifyInstance, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import {
  getRedemptionActions,
  setRedemptionActions,
} from "../../../../../../actions";

import { ParamsType } from "..";
import { RedemptionType } from "../../../../../../../enums/RedemptionType";

const putBody = Type.Object({
  actions: Type.Array(Type.Enum(RedemptionType)),
});

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

  server.route({
    method: "PUT",
    url: "/",
    schema: {
      body: putBody,
    },
    async handler(
      req: FastifyRequest<{ Params: ParamsType; Body: Static<typeof putBody> }>,
      reply
    ) {
      const rewardId = req.params.id;
      const actions = req.body.actions;

      await setRedemptionActions(rewardId, actions);

      const noContent = 204;
      return reply.status(noContent).send();
    },
  });

  return Promise.resolve();
}
