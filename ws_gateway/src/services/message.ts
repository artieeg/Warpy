import { connect, JSONCodec, NatsConnection, Subscription } from "nats";
import { IRecvTracksResponse, subjects } from "@warpy/lib";

const NATS = process.env.NATS_ADDR;
if (!NATS) {
  throw new Error("No nats addr specified");
}

export const sendBackendMessage = (subject: string, data: any) => {
  nc.publish(subject, jc.encode(data));
};

export const sendBackendRequest = async (
  subject: string,
  data: any
): Promise<any> => {
  const nats_response = await nc.request(subject, jc.encode(data), {
    timeout: 240000, //for debug purposes
  });

  const response = jc.decode(nats_response.data) as any;

  console.log(response);

  return response;
};

let nc: NatsConnection;
export const jc = JSONCodec();

export const init = async () => {
  nc = await connect({ servers: [NATS] });
};

export const sendTransportConnect = (
  node: string,
  direction: string,
  data: any
) => {
  if (direction === "send") {
    nc.publish(subjects.media.transport.connect_producer, jc.encode(data));
  } else {
    nc.publish(
      `${subjects.media.transport.connect_consumer}.${node}`,
      jc.encode(data)
    );
  }
};

export const sendNewTrackEvent = (data: any) => {
  nc.publish(subjects.conversations.track.try_send, jc.encode(data));
};

export const sendUserJoinEvent = (data: any) => {
  nc.publish("stream.user.join", jc.encode(data));
};

export const sendUserLeaveEvent = (user: string) => {};

export const sendUserDisconnectEvent = (user: string) => {};

export const sendSpeakerAllowEvent = (data: any) => {
  const payload = jc.encode(data);

  nc.publish("speaker.allow", payload);
};

export const sendUserRaiseHandEvent = (user: string) => {
  const payload = jc.encode({ id: user });

  nc.publish("user.raise-hand", payload);
};

export const sendViewersRequest = (data: any) => {
  const payload = jc.encode(data);

  nc.publish("viewers.get", payload);
};

export const sendRecvTracksRequest = async (node: string, data: any) => {
  const m = jc.encode(data);

  const reply = await nc.request(`${subjects.media.track.getRecv}.${node}`, m, {
    timeout: 1000,
  });

  return jc.decode(reply.data) as IRecvTracksResponse;
};

export const subscribeForRequests = (
  user: string,
  callback: any
): [Subscription, () => Promise<any>] => {
  console.log(`subbign for request.user.${user}`);

  const sub = nc.subscribe(`request.user.${user}`);

  const listen = async () => {
    for await (const msg of sub) {
      const data = jc.decode(msg.data) as any;
      try {
        const response = await callback(data, msg);

        msg.respond(jc.encode(response));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return [sub, listen];
};

export const subscribeForEvents = (
  user: string,
  callback: any
): [Subscription, () => Promise<any>] => {
  console.log(`subbign for reply.user.${user}`);

  const sub = nc.subscribe(`reply.user.${user}`);

  const listen = async () => {
    for await (const msg of sub) {
      const data = jc.decode(msg.data) as any;
      try {
        await callback(data);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return [sub, listen];
};
