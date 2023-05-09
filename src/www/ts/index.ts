import "@fontsource/open-sans";

import { copyPathUrl } from "./helpers/clipboard";
import { fetchChannelPointRewards } from "./manager/events";

document.addEventListener("DOMContentLoaded", async () => {
  const copyPathUrlElements =
    document.querySelectorAll<HTMLElement>(".copy-clipboard");

  for (let i = 0; i < copyPathUrlElements.length; i++) {
    copyPathUrlElements[i].addEventListener("click", copyPathUrl);
  }

  await fetchChannelPointRewards("#channel-point-rewards .rewards");
});
