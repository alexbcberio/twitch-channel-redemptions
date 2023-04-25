import { CreateCard } from "./CreateCard";
import { KaraokeTime } from "./KaraokeTime";
import { RussianRoulette } from "./RussianRoulette";
import { Snow } from "./Snow";

export * from "./CreateCard";
export * from "./KaraokeTime";
export * from "./RussianRoulette";
export * from "./Snow";

export type RedemptionAction =
  | CreateCard
  | KaraokeTime
  | RussianRoulette
  | Snow;
