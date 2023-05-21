import { RewardActionTypes } from "./types";

export * from "./types";

async function rewardActionTypes(): Promise<RewardActionTypes> {
  const req = await fetch("/api/actions/rewards");

  return req.json();
}

export { rewardActionTypes };
