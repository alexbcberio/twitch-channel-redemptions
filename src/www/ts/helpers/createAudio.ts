export function createAudio(path: string) {
  const audio = new Audio(path);
  audio.volume = 0.025;

  return audio;
}
