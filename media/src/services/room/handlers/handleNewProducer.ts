import { createNewPeer } from "@media/models";
import { SFUService, MessageService } from "@media/services";
import { mediaNodeTransferWorker } from "@media/services/sfu";
import { MessageHandler, INewProducer } from "@warpy/lib";
import { Producer } from "mediasoup/lib/Producer";
import { rooms } from "../rooms";

export const handleNewProducer: MessageHandler<INewProducer> = async (data) => {
  const { userId, roomId, rtpCapabilities, kind } = data;

  console.log("new producer data", data);

  const pipeProducer = await SFUService.pipeToIngress.produce({
    id: data.id,
    kind: data.kind,
    rtpParameters: data.rtpParameters,
    appData: data.appData,
  });

  //Map router id -> producer
  const producers: Record<string, Producer> = {};

  for (const worker of SFUService.workers) {
    const result = await mediaNodeTransferWorker.router.pipeToRouter({
      producerId: pipeProducer.id,
      router: worker.router,
    });

    if (result.pipeProducer) {
      producers[worker.router.id] = result.pipeProducer;
    } else {
      console.warn("failed to pipe producer to", worker);
    }
  }

  let room = rooms[roomId];

  if (!room) {
    const { router, audioLevelObserver } = SFUService.getWorker();

    room = {
      router,
      peers: {},
      audioLevelObserver,
    };
    rooms[roomId] = room;
  }

  const { peers } = room;

  if (!peers[userId]) {
    const recvTransport = await SFUService.createTransport(
      "recv",
      SFUService.getWorker().router,
      userId
    );

    peers[userId] = createNewPeer({
      recvTransport,
      producer: {
        audio: kind === "audio" ? producers : {},
        video: kind === "video" ? producers : {},
      },
    });
  } else {
    peers[userId].producer[kind] = producers;
  }

  for (const peerId in peers) {
    if (peerId === userId) {
      continue;
    }

    const { recvTransport: peerRecvTransport, router } = peers[peerId];

    if (!peerRecvTransport || !router) {
      continue;
    }

    try {
      const { consumerParameters } = await SFUService.createConsumer(
        router,
        producers[router.id],
        rtpCapabilities,
        peerRecvTransport,
        userId,
        peers[peerId],
        peerId
      );

      console.log("sending new producer to", peerId);

      MessageService.sendMessageToUser(peerId, {
        event: "@media/new-track",
        data: {
          user: userId,
          consumerParameters,
          roomId,
        },
      });
    } catch (e) {
      console.error(e);
    }
  }
};
