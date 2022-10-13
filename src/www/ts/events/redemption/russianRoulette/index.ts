import * as gunShotSfx from "../../../../static/sfx/toy-gun/shot.mp3";
import * as gunStuckSfx from "../../../../static/sfx/toy-gun/stuck.mp3";
import * as toyGunImg from "../../../../static/img/toy-gun.png";

import { RedemptionMessage } from "../../../../../interfaces/RedemptionMessage";
import { createAudio } from "../../../helpers/createAudio";
import { createImg } from "../../../helpers/createImg";
import { createText } from "../../../helpers/createText";

export function russianRoulette(msg: RedemptionMessage): Promise<void> {
  const { userDisplayName, message } = msg;
  return new Promise((res) => {
    const gotShot = Boolean(message);

    const div = document.createElement("div");
    div.classList.add("alert");
    div.style.margin = ".5rem";

    const img = createImg(toyGunImg);

    const p = createText();

    if (gotShot) {
      p.innerText = `${userDisplayName} se ha ido a un mundo mejor, siempre te recordaremos`;
    } else {
      p.innerText = `${userDisplayName} ha sido afortunado y aún sigue entre nosotros`;
    }

    div.appendChild(img);
    div.appendChild(p);

    img.onload = () => {
      const audioSfx = gotShot ? gunShotSfx : gunStuckSfx;
      const audio = createAudio(audioSfx);

      document.body.appendChild(div);

      if (gotShot) {
        img.classList.add("shoot");
      }

      const timeUntilRemove = 1250;

      audio.onended = () => {
        setTimeout(() => {
          div.remove();
          res();
        }, timeUntilRemove);
      };

      try {
        audio.play();
      } catch (e) {
        // user didn't interact with the document first
      }
    };
  });
}
