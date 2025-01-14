import "module-alias/register";
import dotenv from "dotenv";
import os from "os-utils";

dotenv.config();

import { MessageService, RoomService, SFUService } from "@media/services";
import { role } from "@media/role";
import { NodeInfo } from "@media/nodeinfo";
import { handleEgressMediaRequest } from "@media/services/room";

const main = async () => {
  await Promise.all([MessageService.init(), SFUService.startWorkers()]);

  MessageService.on("create-room", RoomService.handleNewRoom);
  MessageService.on("new-track", RoomService.handleNewTrack);
  MessageService.on("connect-transport", RoomService.handleConnectTransport);
  MessageService.on("join-room", RoomService.handleJoinRoom);
  MessageService.on("recv-tracks-request", RoomService.handleRecvTracksRequest);
  MessageService.on("new-speaker", RoomService.handleNewTransport);
  MessageService.on("new-egress", RoomService.handleNewEgress);
  MessageService.on("new-producer", RoomService.handleNewProducer);
  MessageService.on("user-leave", RoomService.handleUserLeave);
  MessageService.on(
    "remove-user-producers",
    RoomService.handleRemoveUserProducers
  );

  MessageService.on("media-requested", handleEgressMediaRequest);

  SFUService.onActiveSpeakers(MessageService.sendActiveSpeakers);

  if (role === "PRODUCER") {
    MessageService.sendNodeIsOnlineMessage(NodeInfo);
  } else if (role === "CONSUMER") {
    SFUService.observer.on("pipe-is-ready", () => {
      MessageService.sendNodeIsOnlineMessage(NodeInfo);
    });

    // timeout for dev purposes
    setTimeout(async () => {
      SFUService.tryConnectToIngress();
    }, 1000);
  }

  setTimeout(() => {
    setInterval(() => {
      os.cpuUsage((load) => {
        MessageService.send("media.node.info", {
          load,
          node: NodeInfo.id,
          role: NodeInfo.role,
        });
      });
    }, 2000);
  }, 2000);
};

main();
