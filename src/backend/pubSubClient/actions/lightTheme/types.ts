import * as regedit from "regedit";

type ColorTheme = "light" | "dark";

type RegeditListResult = Record<string, regedit.RegistryItem>;

const registerDarkValue = 0;
const registerLightValue = 1;

enum RegisterColorTheme {
  Dark = registerDarkValue,
  Light = registerLightValue,
}

export { ColorTheme, RegeditListResult, RegisterColorTheme };
