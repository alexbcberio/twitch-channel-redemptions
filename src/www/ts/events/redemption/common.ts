function createAudio(path: string) {
  const audio = new Audio(path);
  audio.volume = 0.025;

  return audio;
}

function createImg(path: string) {
  const img = document.createElement("img");
  img.src = path;
  return img;
}

function createText(txt?: string) {
  const p = document.createElement("p");

  if (txt) {
    p.innerText = txt;
  }

  return p;
}

// get a internal style sheet or create it if it does not exist, used to set css variables on :root
function cssSheet(): CSSStyleSheet {
  const targetValue = "cssVariables";
  let style = document.querySelector<HTMLStyleElement>(
    `style[data-target="${targetValue}"]`
  );

  if (style && style.sheet) {
    return style.sheet;
  }

  style = document.createElement("style");
  style.setAttribute("data-target", targetValue);
  document.head.appendChild(style);

  if (!style.sheet) {
    throw new Error("Created style does not contain sheet property");
  }

  return style.sheet;
}

// add css rules to :root element
function insertCssVariables(rules: Record<string, string>) {
  const sheet = cssSheet();

  // eslint-disable-next-line no-magic-numbers
  while (sheet.cssRules.length > 0) {
    // eslint-disable-next-line no-magic-numbers
    sheet.deleteRule(0);
  }

  let rulesTxt = ":root {";
  for (const name in rules) {
    rulesTxt += `${name}: ${rules[name]};`;
  }
  rulesTxt += "}";

  sheet.insertRule(rulesTxt);
}

export { createAudio, createImg, createText, insertCssVariables };
