import { en } from "./en";
import { es } from "./es";

type Messages = typeof es;

const fallbackLanguageCode = "en";

const LOG_PREFIX = "[Localization] ";

function reportLanguage(code: string): void {
  console.log(`${LOG_PREFIX}Using "${code}" language`);
}

function messagesOfLanguage(language: string): Messages {
  switch (language) {
    case "en":
      reportLanguage(language);
      return en;
    case "es":
      reportLanguage(language);
      return es;
    default:
      console.log(
        `${LOG_PREFIX}"${language}" is not supported, falling back to "${fallbackLanguageCode}"`
      );

      return messagesOfLanguage(fallbackLanguageCode);
  }
}

const { locale } = Intl.DateTimeFormat().resolvedOptions();
const primaryLanguage = locale.split("-").shift() ?? fallbackLanguageCode;

const messages = messagesOfLanguage(primaryLanguage);

export { Messages, messages };
