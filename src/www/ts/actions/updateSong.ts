export function updateSong(song: any) {
  const { title, artist, coverArt } = song;
  const playing = document.getElementById("playing");

  if (!playing) {
    return;
  }

  if (!title && !artist) {
    playing.style.display = "none";
    return;
  }

  playing.style.display = "";

  const trackCoverArt = playing.querySelector<HTMLDivElement>(".coverArt");
  const trackName = playing.querySelector<HTMLElement>(".trackName");
  const trackArtist = playing.querySelector<HTMLElement>(".trackArtist");

  if (!trackCoverArt || !trackName || !trackArtist) {
    return;
  }

  trackCoverArt.style.setProperty("--coverArt", `url("${coverArt}")`);
  trackName.innerText = title;
  trackArtist.innerText = artist;
}
