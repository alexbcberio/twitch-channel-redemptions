import { promises as fs } from "fs";
import { handleClientAction } from "../chatClient";
import { resolve } from "path";

const LOG_PREFIX = "[Scheduled] ";
const SCHEDULED_FILE = resolve(process.cwd(), "./storage/scheduled.json");
const FIRST_CHECK_TIMEOUT = 5e3;
const SAVE_TIMEOUT = 5e3;
const CHECK_INTERVAL = 60e3;

const scheduledActions: Array<any> = [];

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
		saveScheduledActions();
	}

	checkingScheduled = false;
}

function saveScheduledActions(): void {
	if (saveScheduledActionsTimeout) {
		clearTimeout(saveScheduledActionsTimeout);
		saveScheduledActionsTimeout = null;
		console.log(`${LOG_PREFIX}Removed save timeout.`);
	}

	saveScheduledActionsTimeout = setTimeout(async () => {
		const normalizedPath = SCHEDULED_FILE.replace(/\\/g, "/");

		try {
			await fs.stat(normalizedPath);
		} catch (e) {
			const dirs = normalizedPath.split("/");
			dirs.pop();
			await fs.mkdir(dirs.join("/"));
		}

		await fs.writeFile(SCHEDULED_FILE, JSON.stringify(scheduledActions));
		console.log(`${LOG_PREFIX}Saved actions.`);
		saveScheduledActionsTimeout = null;
	}, SAVE_TIMEOUT);
}

saveScheduledActions();

export { start, scheduledActions, saveScheduledActions };
