function className(animationName: string) {
  return `animate__${animationName}`;
}

// TODO: add argument for options, delay, animation count, etc.
export function animate(
  element: HTMLElement,
  animationName: string
): Promise<void> {
  const baseClass = className("animated");
  const animationClass = className(animationName);

  element.classList.add(baseClass, animationClass);

  return new Promise((res) => {
    function animationEnd() {
      element.removeEventListener("animationend", animationEnd);
      element.classList.remove(baseClass, animationClass);

      res();
    }

    element.addEventListener("animationend", animationEnd);
  });
}
