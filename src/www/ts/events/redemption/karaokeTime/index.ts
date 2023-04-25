import * as karaokeTimeImg from "../../../../static/img/karaoke-time.png";
import * as karaokeTimeSfx from "../../../../static/sfx/karaoke-time.mp3";
import * as tinycolor from "tinycolor2";

import {
  createAudio,
  createImg,
  createText,
  insertCssVariables,
} from "../common";

function karaokeTime(username: string): Promise<void> {
  return new Promise((res) => {
    const div = document.createElement("div");
    div.classList.add("alert");

    const lightLeft = document.createElement("div");
    lightLeft.classList.add("light", "light-left");
    div.appendChild(lightLeft);

    const lightRight = document.createElement("div");
    lightRight.classList.add("light", "light-right");
    div.appendChild(lightRight);

    const alpha = 0.45;
    const saturation = 100;
    const spinAmount = 90;

    const randomLeft = tinycolor
      .random()
      .setAlpha(alpha)
      .saturate(saturation)
      .toRgbString();
    const randomRight = tinycolor(randomLeft)
      .spin(Math.floor(Math.random() * spinAmount) + spinAmount)
      .toRgbString();

    insertCssVariables({
      "--light-color-left": randomLeft,
      "--light-color-right": randomRight,
    });

    const img = createImg(karaokeTimeImg);
    const p = createText(`${username} ha sugerido cantar un tema`);

    div.appendChild(img);
    div.appendChild(p);
    img.onload = () => {
      const audio = createAudio(karaokeTimeSfx);

      audio.onended = function () {
        div.remove();
        res();
      };

      document.body.appendChild(div);
      audio.play();
    };
  });
}

export { karaokeTime };
