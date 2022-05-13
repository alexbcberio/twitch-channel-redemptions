import { en } from "./en";
import { es } from "./es";
import { info } from "../backend/helpers/log";

type Messages = typeof es;

const fallbackLanguageCode = "en";

const namespace = "Localization";

function reportLanguage(code: string): void {
  info('[%s] Using "%s" language', namespace, code);
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
      info(
        '[%s] "%s" is not supported, falling back to "%s"',
        namespace,
        language,
        fallbackLanguageCode
      );

      return messagesOfLanguage(fallbackLanguageCode);
  }
}

const { locale } = Intl.DateTimeFormat().resolvedOptions();
const primaryLanguage = locale.split("-").shift() ?? fallbackLanguageCode;

const messages = messagesOfLanguage(primaryLanguage);

export { Messages, messages };
