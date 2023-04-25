import { KaraokeTime } from "../../../../interfaces/actions/redemption";
import { RedemptionMessage } from "../../../../interfaces/RedemptionMessage";
import { RedemptionType } from "../../../../enums/RedemptionType";

export function karaokeTime(msg: RedemptionMessage): Promise<KaraokeTime> {
  return Promise.resolve({
    type: RedemptionType.KaraokeTime,
    username: msg.userDisplayName,
  });
}
