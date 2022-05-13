import { Song } from "../../../interfaces/Song";

const hideTimeoutSeconds = 5e3;

let hideTimeout: NodeJS.Timeout;
let previousData: string | null = null;

async function preloadImage(url: string): Promise<string> {
  const data = await fetch(url);
  const blob = await data.blob();

  const reader = new FileReader();

  return new Promise(async (res, rej) => {
    reader.onerror = rej;
    reader.onloadend = () => res(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

// TODO: show player with animation
function showPlayer(player: HTMLElement) {
  player.style.display = "";
}

// TODO: hide player with animation
function hidePlayer(player: HTMLElement) {
  player.style.display = "none";

  previousData = null;
}

async function setData(
  player: HTMLElement,
  data: Song,
  skipAnimation: boolean = false
) {
  const { title, artist, coverArt } = data.song;
  const [previousCoverArt, newCoverArt] =
    player.querySelectorAll<HTMLDivElement>(".coverArt");
  const trackName = player.querySelector<HTMLElement>(".trackName");
  const trackArtist = player.querySelector<HTMLElement>(".trackArtist");

  if (!previousCoverArt || !newCoverArt || !trackName || !trackArtist) {
    return;
  }

  const coverArtValue = skipAnimation ? coverArt : await preloadImage(coverArt);
  const coverArtPropertyValue = `url(${coverArtValue})`;

  newCoverArt.style.setProperty("--coverArt", coverArtPropertyValue);
  trackName.innerText = title;
  trackArtist.innerText = artist;

  if (skipAnimation) {
    previousCoverArt.style.setProperty("--coverArt", coverArtPropertyValue);
    return;
  }

  previousCoverArt.onanimationend = () => {
    previousCoverArt.style.setProperty("--coverArt", coverArtPropertyValue);
    previousCoverArt.classList.remove("previous");
    newCoverArt.classList.remove("next");
  };

  previousCoverArt.classList.remove("previous");
  newCoverArt.classList.remove("next");
  previousCoverArt.classList.add("previous");
  newCoverArt.classList.add("next");
}

export async function updateSong(data: Song) {
  const { title, artist } = data.song;
  const player = document.getElementById("playing");

  if (!player) {
    return;
  }

  clearTimeout(hideTimeout);

  if (!title && !artist) {
    hideTimeout = setTimeout(() => hidePlayer(player), hideTimeoutSeconds);
    return;
  }

  const dataString = JSON.stringify(data);

  // verify data is of a new song
  if (previousData === dataString) {
    return;
  }

  if (!previousData) {
    showPlayer(player);
  }

  await setData(player, data, previousData === null);

  previousData = dataString;
}
