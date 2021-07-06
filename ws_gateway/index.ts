import "module-alias/register";

import { onAuth, onJoinStream } from "@app/handlers";
import { IMessage } from "@app/models";
import { PingPongService } from "@app/services";
import { Context, Handlers } from "@app/types";
import ws from "ws";

const PORT = Number.parseInt(process.env.PORT || "10000");

const server = new ws.Server({
  port: PORT,
});

const handlers: Handlers = {
  auth: onAuth,
  "join-stream": onJoinStream,
};

server.on("connection", (ws) => {
  const context: Context = { ws };

  ws.on("message", (msg) => {
    const message: IMessage = JSON.parse(msg.toString());

    const { event, data } = message;

    handlers[event](data);
  });

  ws.on("pong", () => {
    if (context.user) {
      PingPongService.updatePing(context.user);
    }

    ws.pong();
  });
});