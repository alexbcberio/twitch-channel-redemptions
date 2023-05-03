import { getApiClient, getAuthenticatedUser } from "../../../../helpers/twitch";

import { FastifyInstance } from "fastify";

export default function (server: FastifyInstance) {
  server.route({
    method: "GET",
    url: "/",
    async handler(_req, reply) {
      const apiClient = await getApiClient();
      const user = await getAuthenticatedUser();

      const rawRewards = await apiClient.channelPoints.getCustomRewards(
        user.id
      );
      const rewardImageScale = 4;

      const rewards = rawRewards.map((reward) => {
        return {
          id: reward.id,
          title: reward.title,
          cost: reward.cost,
          color: reward.backgroundColor,
          image: reward.getImageUrl(rewardImageScale),
          enabled: reward.isEnabled,
        };
      });

      return reply.send(rewards.sort((a, b) => a.cost - b.cost));
    },
  });

  return Promise.resolve();
}
