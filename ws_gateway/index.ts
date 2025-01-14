import "module-alias/register";
import joi from "joi";
import { handle } from "./src/handle";
import { IMessage } from "@ws_gateway/models";
import { Context, HandlerConfig } from "@ws_gateway/types";
import ws from "ws";
import { MessageService, PingPongService } from "@ws_gateway/services";
import {
  onAuth,
  onRecvTracksRequest,
  onConnectTransport,
  onConfirmation,
} from "@ws_gateway/handlers";
import { Roles } from "@warpy/lib";

const PORT = Number.parseInt(process.env.PORT || "10000");

const server = new ws.Server({
  port: PORT,
  path: "/ws",
  host: "0.0.0.0",
});

const handlers: Record<string, HandlerConfig> = {
  "join-stream": {
    subject: "stream.join",
    kind: "request",
    auth: true,
    schema: joi.object({
      stream: joi.string().max(64).required(),
    }),
  },

  "search-stream": {
    schema: joi.object({
      textToSearch: joi.string().max(64).required(),
    }),
    kind: "request",
    auth: true,
    subject: "candidate.search",
  },

  "host-reassign": {
    subject: "host.reassign",
    kind: "request",
    auth: true,
    schema: joi.object({ host: joi.string().max(64).required() }),
  },

  "friend-feed-get": {
    subject: "friend-feed.get",
    kind: "request",
    auth: true,
    schema: joi.object({}),
  },

  "leave-stream": {
    subject: "participant.leave",
    kind: "request",
    auth: true,
    schema: joi.object({
      stream: joi.string().required(),
    }),
  },

  "raise-hand": {
    subject: "user.raise-hand",
    kind: "event",
    auth: true,
    schema: joi.object({
      flag: joi.boolean().required(),
    }),
  },

  "speaker-allow": {
    subject: "speaker.allow",
    kind: "event",
    auth: true,
    schema: joi.object({
      speaker: joi.string().max(64).required(),
    }),
  },

  "get-received-awards": {
    subject: "awards.get-received",
    kind: "request",
    auth: true,
    schema: joi.object({
      target: joi.string().max(64).required(),
    }),
  },

  "get-available-awards": {
    subject: "awards.get-available",
    kind: "request",
    auth: true,
    schema: joi.object({}),
  },

  "app-invite-apply": {
    subject: "app-invite.apply",
    kind: "request",
    auth: true,
    schema: joi.object({ code: joi.string().max(64).required() }),
  },

  "update-app-invite-data": {
    subject: "app-invite.update",
    kind: "request",
    auth: true,
    schema: joi.object({}),
  },

  "get-app-invite-data": {
    subject: "app-invite.get",
    kind: "request",
    auth: true,
    schema: joi.object({
      user_id: joi.string().max(64).required(),
    }),
  },

  "send-award": {
    subject: "awards.send-award",
    kind: "request",
    auth: true,
    schema: joi.object({
      message: joi.string().max(128).required(),
      visual: joi.string().max(512).required(),
      recipent: joi.string().max(64).required(),
    }),
  },

  "get-coin-balance": {
    subject: "user.get-coin-balance",
    kind: "request",
    auth: true,
    schema: joi.object({}),
  },

  "invite-action": {
    subject: "invite.action",
    kind: "event",
    auth: true,
    schema: joi.object({
      invite: joi.string().max(64).required(),
      action: joi.allow("accept", "decline").required(),
    }),
  },

  "return-to-viewer": {
    subject: "participant.return-to-viewer",
    kind: "event",
    auth: true,
    schema: joi.object({}),
  },

  "new-track": {
    subject: "media.track.send",
    kind: "event",
    auth: true,
    schema: joi.object().unknown(),
  },

  "request-viewers": {
    subject: "viewers.get",
    kind: "request",
    auth: true,
    schema: joi.object({
      page: joi.number().min(0).required(),
      stream: joi.string().max(64).required(),
    }),
  },

  "stream-stop": {
    subject: "stream.stop",
    kind: "event",
    auth: true,
    schema: joi.object({
      stream: joi.string().max(64).required(),
    }),
  },

  "stream-new": {
    subject: "stream.create",
    kind: "request",
    auth: true,
    schema: joi.object({
      title: joi.string().min(3).max(64).required(),
      category: joi.string().max(64).required(),
    }),
  },

  "request-feed": {
    subject: "candidate.get",
    kind: "request",
    auth: true,
    schema: joi.object({
      page: joi.number().min(0).default(0).optional(),
      category: joi.string().max(64).default(-1).optional(),
    }),
  },

  "new-user": {
    subject: "user.create",
    kind: "request",
    auth: false,
    schema: joi.object().unknown(),
  },

  "new-anon-user": {
    subject: "user.create.anon",
    kind: "request",
    auth: false,
    schema: joi.object({}),
  },

  "delete-user": {
    subject: "user.delete",
    kind: "request",
    auth: true,
    schema: joi.object({}),
  },

  reaction: {
    subject: "stream.reaction",
    kind: "event",
    auth: true,
    schema: joi.object({
      stream: joi.string().max(64).required(),
      emoji: joi.string().max(64).required(),
    }),
  },

  "user-follow": {
    subject: "user.follow",
    kind: "request",
    auth: true,
    schema: joi.object({
      userToFollow: joi.string().max(64).required(),
    }),
  },

  "user-unfollow": {
    subject: "user.unfollow",
    kind: "request",
    auth: true,
    schema: joi.object({
      userToUnfollow: joi.string().max(64).required(),
    }),
  },

  "new-chat-message": {
    subject: "stream.new-chat-message",
    kind: "request",
    auth: true,
    schema: joi.object({
      message: joi.string().max(500).required(),
    }),
  },

  "kick-user": {
    subject: "stream.kick-user",
    kind: "event",
    auth: true,
    schema: joi.object({
      userToKick: joi.string().max(64).required(),
    }),
  },

  "report-user": {
    subject: "user.report",
    kind: "request",
    auth: true,
    schema: joi.object({
      reportedUserId: joi.string().max(64).required(),
      reportReasonId: joi.string().max(64).required(),
    }),
  },

  "unblock-user": {
    subject: "user.unblock",
    kind: "request",
    auth: true,
    schema: joi.object({
      userToUnblock: joi.string().max(64).required(),
    }),
  },

  "block-user": {
    subject: "user.block",
    kind: "request",
    auth: true,
    schema: joi.object({
      userToBlock: joi.string().max(64).required(),
    }),
  },

  "invite-user": {
    schema: joi.object({
      invitee: joi.string().max(64).required(),
      stream: joi.string().allow(null).max(64).optional(),
    }),
    kind: "request",
    auth: true,
    subject: "user.invite",
  },

  "user-list": {
    schema: joi.object({
      list: joi.string().allow("following", "followers", "blocked").required(),
      page: joi.number().min(0).required(),
    }),
    kind: "request",
    auth: true,
    subject: "user.get-list",
  },

  "get-user": {
    schema: joi.object({
      id: joi.string().max(32).required(),
    }),
    kind: "request",
    auth: true,
    subject: "user.get",
  },

  "update-user": {
    schema: joi.object({
      data: {
        username: joi.string().max(16).optional(),
        first_name: joi.string().max(32).optional(),
        bio: joi.string().max(256).optional(),
        avatar: joi
          .string()
          .regex(/tenor.com/)
          .optional(),
      },
    }),
    kind: "request",
    auth: true,
    subject: "user.update",
  },

  "invite-suggestions": {
    schema: joi.object({
      stream: joi.string().max(64).required(),
    }),
    kind: "request",
    auth: true,
    subject: "user.invite-suggestions",
  },

  "read-notifications": {
    schema: joi.object({}),
    kind: "event",
    auth: true,
    subject: "notifications.read",
  },

  "search-user": {
    schema: joi.object({
      textToSearch: joi.string().max(64).required(),
    }),
    kind: "request",
    auth: true,
    subject: "user.search",
  },

  "get-read-notifications": {
    schema: joi.object({ page: joi.number().min(0) }),
    kind: "request",
    auth: true,
    subject: "notifications.get-read",
  },

  "get-unread-notifications": {
    schema: joi.object({}),
    kind: "request",
    auth: true,
    subject: "notifications.get-unread",
  },

  "cancel-stream-invite": {
    schema: joi.object({
      invite_id: joi.string().max(64).required(),
    }),
    kind: "request",
    auth: true,
    subject: "user.cancel-invite",
  },

  "search-gifs": {
    schema: joi.object({
      search: joi.string().required(),
      next: joi.string().optional(),
    }),
    kind: "request",
    subject: "gifs.search",
  },

  "get-trending-gifs": {
    schema: joi.object({
      next: joi.string().optional(),
    }),
    kind: "request",
    subject: "gifs.trending",
  },

  "set-role": {
    schema: joi.object({
      userToUpdate: joi.string().max(64).required(),
      role: joi
        .string()
        .valid(...(["viewer", "speaker", "streamer"] as Roles[])),
    }),
    kind: "request",
    auth: true,
    subject: "participant.set-role",
  },

  "media-toggle": {
    schema: joi.object({
      videoEnabled: joi.boolean().optional(),
      audioEnabled: joi.boolean().optional(),
    }),
    kind: "request",
    auth: true,
    subject: "participant.media-toggle",
  },

  "bot-stream-join": {
    schema: joi.object({
      inviteDetailsToken: joi.string().required(),
    }),
    kind: "request",
    auth: true,
    subject: "bot.join",
  },

  confirmation: {
    schema: joi.object({
      confirmation_id: joi.string().max(64).required(),
      flag: joi.boolean().required(),
    }),
    customHandler: onConfirmation,
  },

  auth: {
    schema: joi.object({
      token: joi.string().max(400).required(),
    }),
    customHandler: onAuth,
  },

  "connect-transport": {
    schema: joi.object().unknown(),
    customHandler: onConnectTransport,
  },

  "recv-tracks-request": {
    schema: joi.object().unknown(),
    customHandler: onRecvTracksRequest,
  },
};

const main = async () => {
  await MessageService.init();
  PingPongService.run();

  console.log("Started ws gateway service");

  const onUserDisconnect = (user: string) => {
    PingPongService.removeUser(user);
    MessageService.sendBackendMessage("user.disconnected", { user });
  };

  PingPongService.observer.on("user-disconnected", onUserDisconnect);

  server.on("connection", (ws) => {
    const context: Context = { ws, batchedChatMessages: [] };

    ws.ping();

    ws.on("message", async (msg) => {
      const message: IMessage = JSON.parse(msg.toString());

      const { event, data, rid } = message;

      try {
        await handle({ data, event, context, rid, handler: handlers[event] });
      } catch (e) {
        console.log("failed to process", event);

        console.error(e);
      }
    });

    ws.on("pong", () => {
      if (context.user) {
        PingPongService.updatePing(context.user);
      }

      setTimeout(() => {
        try {
          ws.ping();
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    });

    ws.on("close", () => {
      if (context.user) {
        onUserDisconnect(context.user);
      }
    });
  });
};

main();
