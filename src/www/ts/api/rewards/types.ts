interface ChannelPointReward {
  id: string;
  title: string;
  cost: number;
  enabled: boolean;
  color: string;
  image: string;
}

type Action = string;
type Actions = {
  actions: Array<Action>;
};

export { ChannelPointReward, Action, Actions };
