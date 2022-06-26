import { closePeerProducers } from "@media/models";
import { MessageHandler } from "@warpy/lib";
import { rooms } from "../rooms";

export const handleUserLeave: MessageHandler<
  {
    user: string;
    stream: string;
  },
  { user: string; status: "ok" | "error" }
> = async (data, respond) => {
  const { user, stream } = data;

  if (!rooms[stream]) {
    return;
  }

  const peer = rooms[stream].peers[user];

  console.log("user leaving", user, stream);

  if (!peer) {
    return respond({
      user,
      status: "error",
    });
  }

  closePeerProducers(peer, { video: true, audio: true });

  peer.recvTransport?.close();
  peer.sendTransport?.close();

  peer.consumers.forEach((consumer) => consumer.close());

  respond({
    user,
    status: "ok",
  });
};
