import { RedemptionType } from "../../../enums/RedemptionType";

export interface CreateCard {
  type: RedemptionType.CreateCard;
  title: string;
  message: string;
  hexColor: string;
  image: string;
}
