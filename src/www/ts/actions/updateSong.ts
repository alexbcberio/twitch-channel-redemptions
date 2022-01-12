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

  const img = playing.querySelector<HTMLImageElement>(".coverArt");
  const trackName = playing.querySelector<HTMLElement>(".trackName");
  const trackArtist = playing.querySelector<HTMLElement>(".trackArtist");

  if (!img || !trackName || !trackArtist) {
    return;
  }

  img.src = coverArt;
  trackName.innerText = title;
  trackArtist.innerText = artist;
}
