import { promises as fs } from "fs";
import { handleClientAction } from "./chatClient";
import { resolve } from "path";

export {
  start,
  scheduledActions,
  checkScheduledActions,
  saveScheduledActions
};

const SCHEDULED_FILE = resolve(process.cwd(), "scheduled.json");
const scheduledActions: Array<any> = [];

let checkingScheduled = false;
let scheduledActionsInterval: NodeJS.Timeout;
let saveScheduledActionsTimeout: NodeJS.Timeout | null;

async function start() {
	// *Check this, not working
	if (!scheduledActionsInterval) {
		let savedActions = [];
		try {
			savedActions = JSON.parse((await fs.readFile(SCHEDULED_FILE)).toString());
		} catch (e) {
			// probably file does not exist
		}
		scheduledActions.push.apply(scheduledActions, savedActions);
		scheduledActions.sort((a, b) => a.scheduledAt - b.scheduledAt);

		setTimeout(checkScheduledActions, 1000 * 5);
		scheduledActionsInterval = setInterval(checkScheduledActions, 1000 * 60);
	}
}

async function checkScheduledActions() {
	if (checkingScheduled) return;
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
		console.log(`[Scheduled] Executed: ${JSON.stringify(action)}`);
	}

	if (hasToSave) {
		saveScheduledActions();
	}

	checkingScheduled = false;
}

function saveScheduledActions() {
	if (saveScheduledActionsTimeout) {
		clearTimeout(saveScheduledActionsTimeout);
		saveScheduledActionsTimeout = null;
		console.log("[Scheduled] Removed save timeout.");
	}

	saveScheduledActionsTimeout = setTimeout(async () => {
		await fs.writeFile(SCHEDULED_FILE, JSON.stringify(scheduledActions));
		console.log("[Scheduled] Saved actions.");
		saveScheduledActionsTimeout = null;
	}, 1000 * 30);
}
