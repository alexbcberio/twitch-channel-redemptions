export function createText(txt?: string) {
  const p = document.createElement("p");

  if (txt) {
    p.innerText = txt;
  }

  return p;
}
