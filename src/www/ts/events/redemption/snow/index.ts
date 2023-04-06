import WSnow from "wsnow";

let wSnow: WSnow | null = null;
let isSnowing = false;
let destroyTimeout: NodeJS.Timeout | null = null;

function getFPS(): Promise<number> {
  return new Promise((res) => {
    requestAnimationFrame((f1) =>
      requestAnimationFrame((f2) => res(1000 / (f2 - f1)))
    );
  });
}

async function createSnow() {
  const fps = Math.round(await getFPS());
  const snowContainer = document.createElement("div");
  snowContainer.id = "snow-container";

  document.body.appendChild(snowContainer);

  return new WSnow({
    el: snowContainer,
    width: window.innerWidth,
    height: window.innerHeight,
    gravity: 750 / fps,
    wind: fps / 600,
    airResistance: 0,
    snowNum: Math.ceil((innerHeight * innerWidth) / 13824),
  });
}

async function startSnow() {
  if (wSnow != null) {
    wSnow.destory();
  }

  wSnow = await createSnow();

  wSnow.start();
  isSnowing = true;
}

function destroySnow() {
  if (wSnow) {
    wSnow.destory();
    wSnow = null;
  }

  isSnowing = false;
}

export async function snow(): Promise<void> {
  if (destroyTimeout) {
    clearTimeout(destroyTimeout);
    destroyTimeout = null;
  }

  if (!isSnowing) {
    await startSnow();
  }

  destroyTimeout = setTimeout(destroySnow, 300e3);
}
