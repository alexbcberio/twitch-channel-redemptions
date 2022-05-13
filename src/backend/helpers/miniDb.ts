import { extendLogger, warning } from "./log";

import { Action } from "../../interfaces/actions/Action";
import { promises as fs } from "fs";
import { handleClientAction } from "../chatClient";
import { resolve } from "path";

const namespace = "Scheduled";
const log = extendLogger(namespace);

const FIRST_CHECK_TIMEOUT = 5e3;
const SAVE_TIMEOUT = 5e3;
const CHECK_INTERVAL = 60e3;

const FILES_BASE = resolve(process.cwd(), "./storage");
const SCHEDULED_FILE = resolve(FILES_BASE, "./scheduled.json");
const VIP_USERS_FILE = resolve(FILES_BASE, "./vips.json");

const defaultScheduledTimestamp = 0;

let scheduledActions: Array<Action> = [];

const vipUsers: Record<string, Array<string>> = {};

let checkingScheduled = false;
let scheduledActionsInterval: NodeJS.Timeout;
let saveScheduledActionsTimeout: NodeJS.Timeout | null;

function save(): void {
  if (saveScheduledActionsTimeout) {
    clearTimeout(saveScheduledActionsTimeout);
    saveScheduledActionsTimeout = null;
    log("Removed save timeout.");
  }

  saveScheduledActionsTimeout = setTimeout(async () => {
    await Promise.all([
      fs.writeFile(SCHEDULED_FILE, JSON.stringify(scheduledActions)),
      fs.writeFile(VIP_USERS_FILE, JSON.stringify(vipUsers)),
    ]);

    log("Saved actions.");
    saveScheduledActionsTimeout = null;
  }, SAVE_TIMEOUT);
}

async function checkScheduledActions(): Promise<void> {
  if (checkingScheduled) {
    return;
  }

  checkingScheduled = true;

  let hasToSave = false;

  for (
    let i = 0;
    i < scheduledActions.length &&
    (scheduledActions[i].scheduledAt ?? defaultScheduledTimestamp) <=
      Date.now();
    i++
  ) {
    hasToSave = true;

    const deleteCount = 1;
    const deletedActions = scheduledActions.splice(i, deleteCount);
    const action = deletedActions.shift();

    if (action) {
      await handleClientAction(action);
    }

    log("Executed: %O", action);
  }

  if (hasToSave) {
    save();
  }

  checkingScheduled = false;
}

async function start(): Promise<void> {
  if (scheduledActionsInterval) {
    return;
  }

  let savedActions = [];
  try {
    savedActions = JSON.parse((await fs.readFile(SCHEDULED_FILE)).toString());
  } catch (e) {
    // probably file does not exist
    if (e instanceof Error) {
      warning("[%s] %s", namespace, e.message);
    }
  }

  scheduledActions = [...scheduledActions, ...savedActions];
  scheduledActions.sort((a, b) => {
    if (typeof a.scheduledAt === "undefined") {
      a.scheduledAt = defaultScheduledTimestamp;
    }

    if (typeof b.scheduledAt === "undefined") {
      b.scheduledAt = defaultScheduledTimestamp;
    }

    return a.scheduledAt - b.scheduledAt;
  });

  setTimeout(checkScheduledActions, FIRST_CHECK_TIMEOUT);
  // eslint-disable-next-line require-atomic-updates
  scheduledActionsInterval = setInterval(checkScheduledActions, CHECK_INTERVAL);

  try {
    const savedVipUsers = JSON.parse(
      await (await fs.readFile(VIP_USERS_FILE)).toString()
    );

    for (const key of Object.keys(savedVipUsers)) {
      vipUsers[key] = savedVipUsers[key];
    }
  } catch (e) {
    // probably file does not exist
    if (e instanceof Error) {
      warning("[%s] %s", namespace, e.message);
    }
  }
}

async function createSaveDirectory() {
  try {
    await fs.stat(FILES_BASE);
  } catch (e) {
    await fs.mkdir(FILES_BASE);
  }
}

createSaveDirectory();

export { start, scheduledActions, save, vipUsers };
