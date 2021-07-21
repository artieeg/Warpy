import { IConnectTransport, IRoom, Rooms } from "@video/models";
import { Producer } from "mediasoup/lib/Producer";
import { MessageService, VideoService } from ".";
import {
  createConsumer,
  createTransport,
  getOptionsFromTransport,
} from "./video";
import {
  IConnectMediaServer,
  IConnectNewSpeakerMedia,
  ICreateMediaRoom,
  IJoinMediaRoom,
  INewMediaRoomData,
  INewMediaTrack,
  INewSpeakerMediaResponse,
  IRecvTracksRequest,
  IRecvTracksResponse,
  MessageHandler,
} from "@warpy/lib";

const rooms: Rooms = {};

const createNewRoom = (): IRoom => {
  return {
    ...VideoService.getWorker(),
    peers: {},
  };
};

export const handleNewSpeaker: MessageHandler<
  IConnectNewSpeakerMedia,
  INewSpeakerMediaResponse
> = async (data, respond) => {
  const { roomId, speaker } = data;

  const room = rooms[roomId];

  if (!room) {
    return;
  }

  const peer = room.peers[speaker];
  peer.sendTransport?.close();

  const transport = await createTransport("send", room.router, speaker);
  peer.sendTransport = transport;

  const sendTransportOptions = getOptionsFromTransport(transport);

  respond!({
    sendTransportOptions,
  });
};

export const handleRecvTracksRequest: MessageHandler<
  IRecvTracksRequest,
  IRecvTracksResponse
> = async (data, respond) => {
  const { roomId, user, rtpCapabilities } = data;

  const room = rooms[roomId];

  if (!room) {
    return;
  }

  const { router, peers } = room;

  const peer = peers[user];

  if (!peer) {
    return;
  }

  const transport = peer.recvTransport;

  if (!transport) {
    return;
  }

  const consumerParams = [];

  for (const peerId of Object.keys(peers)) {
    const peer = peers[peerId];

    if (!peer || peerId == user || !peer.producer) {
      continue;
    }

    try {
      const { producer } = peer;
      consumerParams.push(
        await createConsumer(
          router,
          producer,
          rtpCapabilities,
          transport,
          user,
          peers[peerId]
        )
      );
    } catch (e) {
      continue;
    }
  }

  respond!({
    consumerParams,
  });
};

export const handleJoinRoom = async (data: IJoinMediaRoom) => {
  const { roomId, user } = data;

  const room = rooms[roomId];

  if (!room) {
    return;
  }

  const peer = room.peers[user];
  const { router } = room;

  if (peer) {
    //TODO ?
  }

  const recvTransport = await createTransport("recv", router, user);

  room.peers[user] = {
    recvTransport,
    consumers: [],
    producer: null,
    sendTransport: null,
  };

  MessageService.sendMessageToUser(user, {
    event: "joined-room",
    data: {
      roomId,
      user,
      routerRtpCapabilities: router.rtpCapabilities,
      recvTransportOptions: getOptionsFromTransport(recvTransport),
    },
  });
};

export const handleNewRoom: MessageHandler<
  ICreateMediaRoom,
  INewMediaRoomData
> = async (data, respond) => {
  const { roomId, host } = data;

  if (rooms[roomId]) {
    return;
  }

  const room = createNewRoom();
  rooms[roomId] = room;

  const [sendTransport, recvTransport] = await Promise.all([
    createTransport("send", room.router, host),
    createTransport("recv", room.router, host),
  ]);

  room.peers[host] = {
    recvTransport,
    sendTransport,
    consumers: [],
    producer: null,
  };

  respond!({
    routerRtpCapabilities: rooms[roomId].router.rtpCapabilities,
    recvTransportOptions: VideoService.getOptionsFromTransport(recvTransport),
    sendTransportOptions: VideoService.getOptionsFromTransport(sendTransport),
  });
};

export const handleConnectTransport = async (data: IConnectTransport) => {
  const { roomId, user, dtlsParameters, direction } = data;

  const room = rooms[roomId];

  if (!room) {
    return; //TODO;;; send error
  }

  const peer = room.peers[user];
  const transport =
    direction === "send" ? peer.sendTransport : peer.recvTransport;

  if (!transport) {
    return;
  }

  try {
    await transport.connect({ dtlsParameters });
  } catch (e) {
    console.log("e", e, e.message);
    //TODO
    return;
  }

  MessageService.sendMessageToUser(user, {
    event: `${direction}-transport-connected`,
    data: {
      roomId,
    },
  });
};

export const handleNewTrack = async (data: INewMediaTrack) => {
  const {
    roomId,
    user,
    direction,
    kind,
    rtpParameters,
    rtpCapabilities,
    appData,
    transportId,
  } = data;

  const room = rooms[roomId];

  if (!room) {
    return; //TODO: Send error
  }

  const { peers } = room;

  const peer = peers[user];
  const { sendTransport: transport, producer, consumers } = peer;

  if (!transport) {
    return; //TODO: Send error
  }

  //TODO: Close previous producer if there's one

  let resultId = null;

  let newProducer: Producer;
  try {
    newProducer = await transport.produce({
      kind,
      rtpParameters,
      appData: { ...appData, user, transportId },
    });
  } catch {
    return;
  }

  peer.producer = newProducer;
  resultId = newProducer.id;

  for (const peerId in peers) {
    if (peerId === user) {
      continue;
    }

    const peerRecvTransport = peers[peerId].recvTransport;

    if (!peerRecvTransport) {
      continue;
    }

    try {
      const { consumerParameters } = await createConsumer(
        rooms[roomId].router,
        newProducer,
        rtpCapabilities,
        peerRecvTransport,
        user,
        peers[peerId]
      );

      MessageService.sendMessageToUser(peerId, {
        event: "new-speaker-track",
        data: {
          user,
          consumerParameters,
          roomId,
        },
      });
    } catch (e) {
      console.error(e);
    }
  }

  MessageService.sendMessageToUser(user, {
    event: `${direction}-track-created`,
    data: {
      id: resultId,
    },
  });
};

export const handleNewEgress: MessageHandler<
  IConnectMediaServer,
  IConnectMediaServer
> = async (data, respond) => {
  const { ip, port, srtp } = data;

  const localPipeTransport = await VideoService.createPipeTransport(0);
  await localPipeTransport.connect({ ip, port, srtpParameters: srtp });

  //const { remoteIp, remotePort } = localPipeTransport.tuple;
  const { localIp, localPort } = localPipeTransport.tuple;
  const { srtpParameters } = localPipeTransport;

  console.log("INGRESS PIPE TRANSPORT TUPLE");
  console.log(localPipeTransport.tuple);

  respond!({
    ip: localIp!,
    port: localPort!,
    //ip: remoteIp!,
    //port: remotePort!,
    srtp: srtpParameters,
  });
};

export const tryConnectToIngress = async () => {
  const transport = await VideoService.createPipeTransport(0);

  const remoteParams = await MessageService.tryConnectToIngress({
    ip: transport.tuple.localIp,
    port: transport.tuple.localPort,
    srtp: transport.srtpParameters,
  });

  const { ip, port, srtp } = remoteParams;

  await transport.connect({ ip, port, srtpParameters: srtp });
};
