import * as tinycolor from "tinycolor2";

import { createImg } from "../helpers/createImg";
import { createText } from "../helpers/createText";
import { insertCssVariables } from "../helpers/insertCssVariables";

export function createCard(
  title: string,
  message: string,
  hexColor: string,
  image: string
): Promise<void> {
  const maxMessageLength = 120;
  const darkenLighten = 10;

  return new Promise((res) => {
    const card = document.createElement("div");
    card.classList.add("card", "open");

    const img = createImg(image);
    img.classList.add("card-image");
    card.appendChild(img);

    const body = document.createElement("div");
    body.classList.add("card-body");
    card.appendChild(body);

    const titl = document.createElement("h1");
    titl.classList.add("title");
    titl.innerText = title;
    body.appendChild(titl);

    if (message.length > maxMessageLength) {
      while (message.length > maxMessageLength) {
        // eslint-disable-next-line no-magic-numbers
        message = message.split(" ").slice(0, -1).join(" ");
      }
      message += "...";
    }

    const msg = createText(message);
    msg.classList.add("message");
    body.appendChild(msg);

    let color = tinycolor(hexColor);

    if (!color.isValid()) {
      color = tinycolor("#2EC90C");
    }

    const backgroundColor = color;
    const borderColor = new tinycolor(backgroundColor.toHexString());

    if (backgroundColor.isLight()) {
      card.classList.add("card-light");
      borderColor.darken(darkenLighten).toHexString();
    } else {
      borderColor.lighten(darkenLighten).toHexString();
    }

    insertCssVariables({
      "--card-background-color": backgroundColor.toHexString(),
      "--card-border-color": borderColor.toHexString(),
    });

    card.addEventListener("animationend", () => {
      if (card.classList.contains("open")) {
        card.classList.remove("open");

        const wordsReadPerSecond = 3;
        const minSecondsOpen = 4;
        const maxSecondsOpen = 8;

        const fairTime = message.split(" ").length / wordsReadPerSecond;
        const timeOpen = Math.min(
          Math.max(fairTime, minSecondsOpen),
          maxSecondsOpen
        );

        const msPerSecond = 1e3;

        setTimeout(() => {
          card.classList.add("close");
        }, timeOpen * msPerSecond);
      } else {
        card.remove();
        res();
      }
    });

    img.onload = () => {
      document.body.appendChild(card);
    };
  });
}
