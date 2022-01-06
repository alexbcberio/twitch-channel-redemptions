import { chatClient } from "../..";

async function say(channel: string, message: string): Promise<void> {
  const maxMessageLength = 500;
  // message = `MrDestructoid ${message}`;

  if (message.length > maxMessageLength) {
    const startIndex = 0;
    const suffix = "...";

    message = `${message.substring(
      startIndex,
      maxMessageLength - suffix.length
    )}${suffix}`;
  }

  await chatClient.say(channel, message);
}

async function sayError(channel: string, message: string): Promise<void> {
  await say(channel, `[ERROR] ${message}`);
}

async function sayWarn(channel: string, message: string): Promise<void> {
  await say(channel, `[WARN] ${message}`);
}

async function sayInfo(channel: string, message: string) {
  await say(channel, `[INFO] ${message}`);
}

async function saySuccess(channel: string, message: string): Promise<void> {
  await say(channel, `[SUCCESS] ${message}`);
}

export { say, sayError, sayWarn, sayInfo, saySuccess };
