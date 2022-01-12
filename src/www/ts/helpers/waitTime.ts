export function waitTime(ms?: number) {
  const minTime = 0;
  const defaultTime = 500;

  if (typeof ms === "undefined" || ms <= minTime) {
    ms = defaultTime;
  }

  return new Promise((res) => {
    setTimeout(res, ms);
  });
}
