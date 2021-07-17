import { EventEmitter } from "events";
import { connect, JSONCodec, NatsConnection } from "nats";
import {
  IAllowSpeakerPayload,
  INewTrackPayload,
  IParticipant,
  IStream,
} from "@app/models";

const eventEmitter = new EventEmitter();

const NATS = process.env.NATS_ADDR;
if (!NATS) {
  throw new Error("No nats addr specified");
}

let nc: NatsConnection;
const jc = JSONCodec();

export const init = async () => {
  nc = await connect({ servers: [NATS] });

  handleNewStream();
  handleStreamEnd();
  handleStreamJoin();
  handleStreamLeave();
  handleAllowSpeaker();
  handleRaisedHand();
  handleNewTrack();
};

type Events =
  | "conversation-new"
  | "conversation-end"
  | "participant-new"
  | "speaker-allow"
  | "raise-hand"
  | "new-track"
  | "participant-leave";

export const on = (event: Events, handler: any) => {
  eventEmitter.on(event, handler);
};

const handleNewTrack = async () => {
  const sub = nc.subscribe("stream.new-track");

  for await (const msg of sub) {
    const { user, track } = jc.decode(msg.data) as any;

    const data: INewTrackPayload = {
      user,
      track,
    };

    eventEmitter.emit("new-track", data);
  }
};

const handleRaisedHand = async () => {
  const sub = nc.subscribe("user.raise-hand");

  for await (const msg of sub) {
    const { id } = jc.decode(msg.data) as any;
    console.log("raised hand event", id);

    eventEmitter.emit("raise-hand", id);
  }
};

const handleStreamLeave = async () => {
  const sub = nc.subscribe("stream.user.leave");

  for await (const msg of sub) {
    const { id } = jc.decode(msg.data) as any;

    eventEmitter.emit("participant-leave", id);
  }
};

const handleAllowSpeaker = async () => {
  const sub = nc.subscribe("speaker.allow");

  for await (const msg of sub) {
    const { speaker, user } = jc.decode(msg.data) as any;

    eventEmitter.emit("speaker-allow", {
      speaker,
      user,
    } as IAllowSpeakerPayload);
  }
};

const handleStreamJoin = async () => {
  const sub = nc.subscribe("stream.user.join");

  for await (const msg of sub) {
    const { user, stream } = jc.decode(msg.data) as any;

    const participant: IParticipant = {
      id: user,
      stream,
    };

    eventEmitter.emit("participant-new", participant);
  }
};

const handleStreamEnd = async () => {
  const sub = nc.subscribe("stream.ended", { queue: "conversations" });

  for await (const msg of sub) {
    const { id } = jc.decode(msg.data) as any;

    eventEmitter.emit("conversation-end", id);
  }
};

const handleNewStream = async () => {
  const sub = nc.subscribe("stream.created", { queue: "conversations" });

  for await (const msg of sub) {
    const message = jc.decode(msg.data) as any;

    const newStream: IStream = {
      id: message.id,
      owner: message.owner,
    };

    eventEmitter.emit("conversation-new", newStream);
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
