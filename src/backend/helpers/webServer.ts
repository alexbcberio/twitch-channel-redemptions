import { IncomingMessage, Server } from "http";
import { saveScheduledActions, scheduledActions } from "./miniDb";

import { Action } from "../../interfaces/actions/Action";
import { AddressInfo } from "net";
import { Socket } from "net";
import WebSocket from "ws";
import express from "express";
import { handleClientAction } from "../chatClient";
import { isDevelopment } from "./util";
import { join } from "path";

const LOG_PREFIX_HTTP = "[HTTP] ";
const LOG_PREFIX_WS = "[WS] ";

const app = express();
const sockets: Array<WebSocket> = [];

const wsServer = new WebSocket.Server({
	noServer: true
});

let server: Server;

export { listen, broadcast };

wsServer.on("connection", onConnection);

app.use(express.static(join(process.cwd(), "client")));

function listen() {
	if (server) {
		console.log(`${LOG_PREFIX_HTTP}Server is already running`);
		return;
	}

	server = app.listen(!isDevelopment ? 8080 : 8081, "0.0.0.0");

	server.on("listening", onListening);
	server.on("upgrade", onUpgrade);
}

function onListening() {
	console.log(
		`${LOG_PREFIX_HTTP}Listening on port ${
			(server.address() as AddressInfo).port
		}`
	);
}

function onUpgrade(req: IncomingMessage, socket: Socket, head: Buffer) {
	wsServer.handleUpgrade(req, socket, head, socket => {
		wsServer.emit("connection", socket, req);
	});
}

function onConnection(socket: WebSocket, req: IncomingMessage) {
	console.log(
		`${LOG_PREFIX_WS}${req.socket.remoteAddress} New connection established`
	);
	sockets.push(socket);
	socket.send(
		JSON.stringify({
			env: isDevelopment ? "dev" : "prod"
		})
	);

	socket.on("message", onMessage);
	socket.on("close", onClose);
}

// broadcast a message to all clients
function broadcast(msg: string, socket?: any) {
	const filteredSockets = socket ? sockets.filter(s => s !== socket) : sockets;

	filteredSockets.forEach(s => s.send(msg));
}

async function onMessage(msg: string) {
	// @ts-ignore
	const socket = this as WebSocket;
	const data = JSON.parse(msg);

	if (!data.actions || data.actions.length === 0) {
		broadcast(msg, socket);
		return;
	}

	const actions: Array<Action> = data.actions;

	for (const action of actions) {
		if (!action.scheduledAt) {
			await handleClientAction(action);
		} else {
			scheduledActions.push(action);
			scheduledActions.sort((a: any, b: any) => a.scheduledAt - b.scheduledAt);
			saveScheduledActions();
		}
	}

	console.log(
		`${LOG_PREFIX_WS}Received message with ${data.actions.length} actions:`,
		data
	);
}

function onClose() {
	// @ts-ignore
	const socket: WebSocket = this as WebSocket;

	const socketIdx = sockets.indexOf(socket);
	sockets.splice(socketIdx, 1);
	console.log(`${LOG_PREFIX_WS}Connection closed`);
}
