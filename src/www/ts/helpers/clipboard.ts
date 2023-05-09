function copyPathUrl(e: Event) {
  const target = e.target;

  if (target === null || !(target instanceof HTMLElement)) {
    return;
  }

  const path = target.getAttribute("data-path");

  if (path === null) {
    return;
  }

  navigator.clipboard.writeText(`${location.origin}${path}`);
}

export { copyPathUrl };
