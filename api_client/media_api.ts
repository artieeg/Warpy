import { APIModule, EventHandler } from "./types";
import { RequestRecvTracks, IRecvTracksResponse } from "@warpy/lib";

export interface IMediaAPI {
  newTrack: (data: any) => any;
  connectTransport: (data: any, isProducer: boolean) => any;
  getRecvTracks: (data: any) => Promise<IRecvTracksResponse>;
  onNewTrack: EventHandler;
  onceRecvTransportConnected: EventHandler;
  onceSendTransportConnected: EventHandler;
}

export const MediaAPI: APIModule = (socket): IMediaAPI => ({
  newTrack: (data: any) => socket.publish("new-track", data),
  connectTransport: (data: any, isProducer: boolean = false) =>
    socket.publish("connect-transport", { ...data, isProducer }),
  getRecvTracks: (data: RequestRecvTracks) =>
    socket.request("recv-tracks-request", data),
  onNewTrack: (handler) => socket.on("@media/new-track", handler),
  onceRecvTransportConnected: (handler) =>
    socket.once("@media/recv-transport-connected", handler),
  onceSendTransportConnected: (handler) =>
    socket.once("@media/send-transport-connected", handler),
});
