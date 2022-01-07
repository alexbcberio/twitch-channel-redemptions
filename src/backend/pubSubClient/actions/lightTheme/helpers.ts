import * as regedit from "regedit";

import { ColorTheme, RegeditListResult, RegisterColorTheme } from "./types";
import { readFile, stat, writeFile } from "fs/promises";
import { vsCodeDarkTheme, vsCodeLightTheme } from ".";

import { platform } from "os";
import { resolve } from "path";

const isWindows = platform() === "win32";
const registerColorThemePath =
  "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";

function vsCodeSettingsPath(): string {
  if (!isWindows) {
    throw new Error("This function only supports win32 platform");
  }

  const vsCodeSettings = resolve(
    // @ts-expect-error Type string | undefined is not assignable
    process.env.APPDATA,
    "./Code/User/settings.json"
  );

  return vsCodeSettings;
}

async function existsVsCodeSettings(): Promise<boolean> {
  try {
    await stat(vsCodeSettingsPath());
  } catch (e) {
    return false;
  }

  return true;
}

async function changeVsCodeColorTheme(colorTheme: ColorTheme): Promise<void> {
  let theme: string;

  switch (colorTheme) {
    case "light":
      theme = vsCodeLightTheme;
      break;
    case "dark":
    default:
      theme = vsCodeDarkTheme;
  }

  if (!theme) {
    return;
  }

  const filePath = vsCodeSettingsPath();
  const settings = JSON.parse((await readFile(filePath)).toString());

  const colorThemeSettingKey = "workbench.colorTheme";

  if (settings[colorThemeSettingKey] === theme) {
    return;
  }

  settings[colorThemeSettingKey] = theme;

  await writeFile(filePath, JSON.stringify(settings));
}

function regeditList(keys: string | Array<string>): Promise<RegeditListResult> {
  const listKeys = Array.isArray(keys) ? keys : [keys];

  return new Promise((res, rej) => {
    regedit.list(listKeys, (err, result) => {
      if (err) {
        rej(err);
      }

      res(result);
    });
  });
}

function regeditPut(values: regedit.RegistryItemPutCollection): Promise<void> {
  return new Promise((res, rej) => {
    regedit.putValue(values, (err) => {
      if (err) {
        rej(err);
      }

      res();
    });
  });
}

async function changeRegisterColorTheme(
  value: RegisterColorTheme
): Promise<void> {
  const type = "REG_DWORD";

  const values: regedit.RegistryItemPutCollection = {
    [registerColorThemePath]: {
      SystemUsesLightTheme: {
        value,
        type,
      },
      AppsUseLightTheme: {
        value,
        type,
      },
    },
  };

  await regeditPut(values);
}

function registerColorThemeValue(colorTheme: ColorTheme): RegisterColorTheme {
  let registerValue: RegisterColorTheme;

  switch (colorTheme) {
    case "light":
      registerValue = RegisterColorTheme.Light;
      break;
    case "dark":
    default:
      registerValue = RegisterColorTheme.Dark;
  }

  return registerValue;
}

async function changeWindowsColorTheme(colorTheme: ColorTheme): Promise<void> {
  const registerValue = registerColorThemeValue(colorTheme);
  const listResult = await regeditList(registerColorThemePath);
  const keyValues = listResult[registerColorThemePath].values;
  const { AppsUseLightTheme, SystemUsesLightTheme } = keyValues;

  if (
    AppsUseLightTheme.value === registerValue &&
    SystemUsesLightTheme.value === registerValue
  ) {
    return;
  }

  await changeRegisterColorTheme(registerValue);
}

export {
  isWindows,
  existsVsCodeSettings,
  changeVsCodeColorTheme,
  changeWindowsColorTheme,
};
