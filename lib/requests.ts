import { MediaDirection, MediaKind, MediaServiceRole } from "./types";

export interface ITransportOptions {
  id: string;
  iceParameters: any;
  iceCandidates: any[];
  dtlsParameters: any;
}

export interface ICreateMediaRoom {
  host: string;
  roomId: string;
}

export interface INewMediaRoomData {
  routerRtpCapabilities: any;
  //recvTransportOptions: ITransportOptions;
  sendTransportOptions: {
    video: ITransportOptions;
    audio: ITransportOptions;
  };
}

export interface INewMediaTrack {
  roomId: string;
  user: string;
  direction: MediaDirection;
  kind: MediaKind;
  rtpParameters: any;
  rtpCapabilities: any;
  transportId: string;
  appData: any;
}

export interface IJoinMediaRoom {
  roomId: string;
  user: string;
}

export interface IConnectNewSpeakerMedia {
  roomId: string;
  speaker: string;
}

export interface INewSpeakerMediaResponse {
  sendTransportOptions: {
    audio: ITransportOptions;
  };
  rtpCapabilities: any;
}

export interface IConnectMediaTransport {
  transportId: string;
  dtlsParameters: any;
  direction: MediaDirection;
  mediaKind?: any;
  roomId: string;
  user: string;
}

/*
export interface INewMediaTrack {
  transportId: string;
  kind: MediaKind;
  rtpParameters: any;
  rtpCapabilities: any;
  paused: boolean;
  roomId: string;
  direction: MediaDirection;
  appData: any;
}
*/

export interface IRecvTracksRequest {
  roomId: string;
  user: string;
  rtpCapabilities: any;
}

export interface IRecvTracksResponse {
  consumerParams: any[];
}

export interface IConnectMediaServer {
  node: string;
  ip: string;
  port: number;
  srtp?: any;
}

export interface INewProducer {
  id: string;
  kind: MediaKind;
  rtpParameters: any;
  rtpCapabilities: any;
  appData: any;
  roomId: string;
  userId: string;
}

export interface INewMediaNode {
  id: string;
  role: MediaServiceRole;
}

export interface IRequestViewers {
  user: string;
  stream: string;
  page: number;
}

export interface IWhoAmIRequest {
  user: string;
}

export interface INewStream {
  owner: string;
  title: string;
  hub: string;
}

export interface IJoinStream {
  stream: string;
  user: string;
}

export interface IStopStream {
  stream: string;
  user: string;
}

export interface IUserDisconnected {
  user: string;
}

export interface IRaiseHand {
  user: string;
}

export interface IRequestFeed {
  user: string;
  hub?: string;
}

export interface INewUser {
  username: string;
  last_name: string;
  first_name: string;
  email: string;
  kind: "dev" | "apple" | "google" | "twitter" | "facebook";
}
