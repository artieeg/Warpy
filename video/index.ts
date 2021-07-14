import "module-alias/register";
import dotenv from "dotenv";

dotenv.config();

import { MessageService, RoomService, VideoService } from "@app/services";

const main = async () => {
  await Promise.all([MessageService.init(), VideoService.startWorkers()]);

  MessageService.on("create-room", RoomService.handleNewRoom);
  MessageService.on("new-track", RoomService.handleNewTrack);
  MessageService.on("connect-transport", RoomService.handleConnectTransport);
};

main();
