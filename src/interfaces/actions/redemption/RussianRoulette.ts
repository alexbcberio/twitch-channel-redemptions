import { RedemptionType } from "../../../enums/RedemptionType";

export interface RussianRoulette {
  type: RedemptionType.RussianRoulette;
  userDisplayName: string;
  gotShot: boolean;
}
