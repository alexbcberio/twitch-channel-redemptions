import { promises as fs } from "fs";
import { handleClientAction } from "../chatClient";
import { resolve } from "path";

const LOG_PREFIX = "[Scheduled] ";

const FIRST_CHECK_TIMEOUT = 5e3;
const SAVE_TIMEOUT = 5e3;
const CHECK_INTERVAL = 60e3;

const FILES_BASE = resolve(process.cwd(), "./storage");
const SCHEDULED_FILE = resolve(FILES_BASE, "./scheduled.json");
const VIP_USERS_FILE = resolve(FILES_BASE, "./vips.json");

const scheduledActions: Array<any> = [];
const vipUsers: Record<string, Array<string>> = {};

let checkingScheduled = false;
let scheduledActionsInterval: NodeJS.Timeout;
let saveScheduledActionsTimeout: NodeJS.Timeout | null;

// *Check this, not working
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
			console.log(`${LOG_PREFIX}${e.message}`);
		}
	}

	scheduledActions.push.apply(scheduledActions, savedActions);
	scheduledActions.sort((a, b) => a.scheduledAt - b.scheduledAt);

	setTimeout(checkScheduledActions, FIRST_CHECK_TIMEOUT);
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
			console.log(`${LOG_PREFIX}${e.message}`);
		}
	}
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
		scheduledActions[i].scheduledAt <= Date.now();
		i++
	) {
		hasToSave = true;

		const action = scheduledActions.splice(i, 1)[0];
		await handleClientAction(action);
		console.log(`${LOG_PREFIX}Executed: ${JSON.stringify(action)}`);
	}

	if (hasToSave) {
		save();
	}

	checkingScheduled = false;
}

async function createSaveDirectory() {
	try {
		await fs.stat(FILES_BASE);
	} catch (e) {
		await fs.mkdir(FILES_BASE);
	}
}

function save(): void {
	if (saveScheduledActionsTimeout) {
		clearTimeout(saveScheduledActionsTimeout);
		saveScheduledActionsTimeout = null;
		console.log(`${LOG_PREFIX}Removed save timeout.`);
	}

	saveScheduledActionsTimeout = setTimeout(async () => {
		await Promise.all([
			fs.writeFile(SCHEDULED_FILE, JSON.stringify(scheduledActions)),
			fs.writeFile(VIP_USERS_FILE, JSON.stringify(vipUsers))
		]);

		console.log(`${LOG_PREFIX}Saved actions.`);
		saveScheduledActionsTimeout = null;
	}, SAVE_TIMEOUT);
}

createSaveDirectory();

export { start, scheduledActions, save, vipUsers };
