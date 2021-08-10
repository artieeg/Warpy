import { EventEmitter } from "events";
import { connect, JSONCodec, NatsConnection } from "nats";
import { IRequestGetTracks } from "@backend/models";
import {
  IConnectMediaTransport,
  IConnectNewSpeakerMedia,
  ICreateMediaRoom,
  IJoinMediaRoom,
  INewMediaNode,
  INewMediaRoomData,
  INewMediaTrack,
  INewSpeakerMediaResponse,
  IRecvTracksRequest,
  IRecvTracksResponse,
  MessageHandler,
  subjects,
} from "@warpy/lib";

const eventEmitter = new EventEmitter();

const NATS = process.env.NATS_ADDR;
if (!NATS) {
  throw new Error("No nats addr specified");
}

let nc: NatsConnection;
const jc = JSONCodec();

const SubjectEventMap = {
  "stream.stop": "stream-stop",
  "user.disconnected": "user-disconnected",
  "stream.create": "stream-new",
  "user.whoami-request": "whoami-request",
  "feeds.get": "feed-request",
  "viewers.get": "viewers-request",
  "stream.join": "user-joins-stream",
  "user.raise-hand": "raise-hand",
  "speaker.allow": "speaker-allow",
  "user.create": "new-user",
};

type Subject = keyof typeof SubjectEventMap;

const subscribeTo = async (subject: Subject) => {
  const sub = nc.subscribe(subject);

  for await (const msg of sub) {
    const message = jc.decode(msg.data) as any;
    eventEmitter.emit(SubjectEventMap[subject], message, (response: any) => {
      msg.respond(jc.encode(response));
    });
  }
};

export const handleMessages = () => {
  Object.keys(SubjectEventMap).forEach((key) => {
    subscribeTo(key as Subject);
  });
};

export const init = async () => {
  nc = await connect({ servers: [NATS] });

  handleMessages();

  handleNewMediaNode();
  //handleNewTrack();
  handleRecvTracksRequest();
  handleConnectTransport();
};

type Events =
  | "conversation-new"
  | "recv-tracks-request"
  | "conversation-end"
  | "participant-new"
  | "speaker-allow"
  | "raise-hand"
  | "new-track"
  | "connect-transport"
  | "new-media-node"
  | typeof SubjectEventMap[Subject];

export const on = (event: Events, handler: MessageHandler<any, any>) => {
  eventEmitter.on(event, handler);
};

const handleConnectTransport = async () => {
  const sub = nc.subscribe(subjects.conversations.transport.try_connect);

  for await (const msg of sub) {
    const { transportId, dtlsParameters, direction, roomId, user, mediaKind } =
      jc.decode(msg.data) as any;

    const data: IConnectMediaTransport = {
      transportId,
      dtlsParameters,
      direction,
      roomId,
      user,
      mediaKind,
    };

    eventEmitter.emit("connect-transport", data);
  }
};

const handleNewTrack = async () => {
  const sub = nc.subscribe(subjects.conversations.track.try_send);

  for await (const msg of sub) {
    const {
      user,
      transportId,
      kind,
      rtpParameters,
      rtpCapabilities,
      roomId,
      appData,
      direction,
      mediaPermissionsToken,
    } = jc.decode(msg.data) as any;

    const data: INewMediaTrack = {
      user,
      transportId,
      kind,
      rtpParameters,
      rtpCapabilities,
      roomId,
      appData,
      direction,
      mediaPermissionsToken,
    };

    eventEmitter.emit("new-track", data);
  }
};

const handleNewMediaNode = async () => {
  const sub = nc.subscribe(subjects.media.node.isOnline, {
    queue: "conversations",
  });

  for await (const msg of sub) {
    const message = jc.decode(msg.data) as any;

    const newStream: INewMediaNode = {
      id: message.id,
      role: message.role,
    };

    eventEmitter.emit("new-media-node", newStream);
  }
};

const _sendMessage = async (user: string, message: Uint8Array) => {
  nc.publish(`reply.user.${user}`, message);
};

export const sendMessage = async (user: string, message: any) => {
  _sendMessage(user, jc.encode(message));
};

export const sendMessageBroadcast = async (users: string[], message: any) => {
  const encodedMessage = jc.encode(message);

  users.forEach((user) => _sendMessage(user, encodedMessage));
};

export const createMediaRoom = async (
  data: ICreateMediaRoom
): Promise<INewMediaRoomData> => {
  const m = jc.encode(data);

  const reply = await nc.request(subjects.media.room.create, m, {
    timeout: 1000,
  });

  return jc.decode(reply.data) as INewMediaRoomData;
};

export const getRecvTracks = async (
  node: string,
  data: IRecvTracksRequest
): Promise<IRecvTracksResponse> => {
  const m = jc.encode(data);

  const reply = await nc.request(`${subjects.media.track.getRecv}.${node}`, m, {
    timeout: 1000,
  });

  return jc.decode(reply.data) as IRecvTracksResponse;
};

export const connectSpeakerMedia = async (
  data: IConnectNewSpeakerMedia
): Promise<INewSpeakerMediaResponse> => {
  const m = jc.encode(data);

  const reply = await nc.request(subjects.media.peer.makeSpeaker, m, {
    timeout: 1000,
  });

  return jc.decode(reply.data) as INewSpeakerMediaResponse;
};

export const sendConnectTransport = async (
  node: string,
  data: IConnectMediaTransport
) => {
  nc.publish(
    data.direction === "send"
      ? subjects.media.transport.connect_producer
      : `${subjects.media.transport.connect_consumer}.${node}`,
    jc.encode(data)
  );
};

export const sendNewTrack = async (data: INewMediaTrack) => {
  const m = jc.encode(data);

  nc.publish(subjects.media.track.send, m);
};

export const joinMediaRoom = async (node: string, data: IJoinMediaRoom) => {
  const m = jc.encode(data);

  nc.publish(`${subjects.media.peer.join}.${node}`, m);
};

export const handleRecvTracksRequest = async () => {
  const sub = nc.subscribe(subjects.conversations.track.try_get);

  for await (const msg of sub) {
    const data = jc.decode(msg.data) as any;

    const event: IRequestGetTracks = {
      user: data.user,
      stream: data.stream,
      rtpCapabilities: data.rtpCapabilities,
    };

    eventEmitter.emit("recv-tracks-request", event, (d: any) => {
      msg.respond(jc.encode(d));
    });
  }
};
