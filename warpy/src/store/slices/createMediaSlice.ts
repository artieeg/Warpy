import {MediaClient} from '@warpykit-sdk/client';
import {GetState, SetState} from 'zustand';
import {IStore} from '../useStore';
import {MediaStream, MediaStreamTrack} from 'react-native-webrtc';
import {Transport, Producer, MediaKind} from 'mediasoup-client/lib/types';
import produce from 'immer';

export interface IMediaSlice {
  mediaClient?: MediaClient;
  video?: {
    stream: MediaStream;
    track: MediaStreamTrack;
    producer?: Producer;
  };
  audio?: {
    stream: MediaStream;
    track: MediaStreamTrack;
    producer?: Producer;
  };
  audioMuted: boolean;

  sendTransport: Transport | null;
  recvTransport: Transport | null;

  /**
   * Mediasoup recv params
   */
  recvMediaParams?: any;

  /**
   * Mediasoup send params
   */
  sendMediaParams?: any;

  /**
   * Stores audio/video streaming permissions
   * */
  mediaPermissionsToken: string | null;

  sendMedia: (
    permissions: string,
    tracks: ('audio' | 'video')[],
  ) => Promise<void>;

  initViewerMedia: (permissions: string, recvMediaParams: any) => Promise<void>;

  toggleAudio: (flag: boolean) => void;
  toggleVideo: (flag: boolean) => void;
  switchCamera: () => void;
  closeProducers: (producers: MediaKind[]) => void;
}

export const createMediaSlice = (
  set: SetState<IStore>,
  get: GetState<IStore>,
): IMediaSlice => ({
  sendTransport: null,
  mediaPermissionsToken: null,
  audioMuted: false,
  recvTransport: null,

  closeProducers(producers) {
    set(
      produce<IStore>(state => {
        producers.forEach(producer => {
          state[producer]?.producer?.close();
          state[producer] = undefined;
        });
      }),
    );
  },

  switchCamera() {
    (get().video?.track as any)._switchCamera();
  },

  toggleAudio(flag) {
    get()
      .audio?.stream.getAudioTracks()
      .forEach(audio => (audio.enabled = flag));

    set({
      audioMuted: flag,
    });
  },

  toggleVideo(_flag) {},

  async initViewerMedia(permissions, recvMediaParams) {
    const {api, recvDevice, sendDevice} = get();

    if (!recvDevice.loaded) {
      await recvDevice.load({
        routerRtpCapabilities: recvMediaParams.routerRtpCapabilities,
      });
    }

    const mediaClient = new MediaClient(
      recvDevice,
      sendDevice,
      api,
      permissions,
    );

    set({
      mediaPermissionsToken: permissions,
      mediaClient,
      recvMediaParams,
    });
  },

  async sendMedia(permissions, tracks) {
    const {mediaClient, stream, sendMediaParams, sendDevice} = get();

    if (!mediaClient) {
      return;
    }

    const {routerRtpCapabilities, sendTransportOptions} = sendMediaParams;

    if (!sendDevice.loaded) {
      await sendDevice.load({routerRtpCapabilities});
    }

    mediaClient.permissionsToken = permissions;
    mediaClient.sendDevice = sendDevice;

    let sendTransport = get().sendTransport;

    if (!sendTransport) {
      sendTransport = await mediaClient.createTransport({
        roomId: stream!,
        device: sendDevice,
        direction: 'send',
        options: {
          sendTransportOptions,
        },
        isProducer: true,
      });

      set({sendTransport});
    }

    tracks.forEach(async kind => {
      const track = get()[kind]?.track;

      if (track) {
        const producer = await mediaClient.sendMediaStream(
          track,
          kind,
          sendTransport as Transport,
        );

        set(
          produce<IStore>(state => {
            state[kind]!.producer = producer;
          }),
        );
      }
    });
  },
});
