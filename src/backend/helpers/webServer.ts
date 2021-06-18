import { IncomingMessage, Server } from "http";
import { broadcast, handleClientAction } from "./chatClient";
import { saveScheduledActions, scheduledActions } from "./scheduledActions";

import { AddressInfo } from "net";
import { Socket } from "net";
import WebSocket from "ws";
import express from "express";
import { isDevelopment } from "./util";
import { join } from "path";

const app = express();
const sockets: Array<WebSocket> = [];

const wsServer = new WebSocket.Server({
	noServer: true
});

let server: Server;

export {
  listen,
	// TODO: use intermediate class to handle socket messages
  sockets
}

wsServer.on("connection", onConnection);

app.use(express.static(join(process.cwd(), "client")));

function listen() {
  if (server) {
    console.log("[Webserver] Server is already running");
    return;
  }

  server = app.listen(!isDevelopment ? 8080 : 8081, "0.0.0.0");

  server.on("listening", onListening);
  server.on("upgrade", onUpgrade);
}

function onListening() {
  console.log(
    `[Webserver] Listening on port ${(server.address() as AddressInfo).port}`
  );
}

function onUpgrade(req: IncomingMessage, socket: Socket, head: Buffer) {
  wsServer.handleUpgrade(req, socket, head, socket => {
    wsServer.emit("connection", socket, req);
  });
}

function onConnection(socket: WebSocket, req: IncomingMessage) {
	console.log(`[WS] ${req.socket.remoteAddress} New connection established`);
	sockets.push(socket);
	socket.send(
		JSON.stringify({
			env: isDevelopment ? "dev" : "prod"
		})
	);

	socket.on("message", (msg: string) => onMessage(msg, socket));

	socket.on("close", () => onClose(socket));
}

async function onMessage(msg: string, socket: WebSocket) {
	const data = JSON.parse(msg);

	if (!data.actions || data.actions.length === 0) {
		broadcast(msg, socket);
		return;
	}

	for (const action of data.actions) {
		if (!action.scheduledAt) {
			await handleClientAction(action);
		} else {
			scheduledActions.push(action);
			scheduledActions.sort((a: any, b: any) => a.scheduledAt - b.scheduledAt);
			saveScheduledActions();
		}
	}

	console.log(`[WS] Received message with ${data.actions.length} actions:`, data);
}

function onClose(socket: WebSocket) {
  const socketIdx = sockets.indexOf(socket);
  sockets.splice(socketIdx, 1);
  console.log("[WS] Connection closed");
}