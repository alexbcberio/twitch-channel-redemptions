export function createImg(path: string) {
  const img = document.createElement("img");
  img.src = path;
  return img;
}
