import { IStore } from "../../useStore";
import { AppState } from "../AppState";
import { StateUpdate } from "../types";

export interface MediaManager {
  switchCamera: () => any;
  toggleAudio: () => Promise<StateUpdate>;
  toggleVideo: () => Promise<StateUpdate>;
  toggleParticipantMedia: (
    user: string,
    params: { audio: boolean; video: boolean }
  ) => Promise<StateUpdate>;
}

export class MediaManagerImpl implements MediaManager {
  private state: AppState;

  constructor(state: AppState | IStore) {
    if (state instanceof AppState) {
      this.state = state;
    } else {
      this.state = new AppState(state);
    }
  }

  switchCamera() {
    (this.state.get().video?.track as any)._switchCamera();
  }

  async toggleVideo() {
    const { api, stream, video, videoEnabled } = this.state.get();

    if (stream) {
      await api.stream.toggleMedia({ videoEnabled: !videoEnabled });
    }

    video?.stream
      .getVideoTracks()
      .forEach((video: any) => (video.enabled = !videoEnabled));

    return this.state.update({
      videoEnabled: !videoEnabled,
    });
  }

  async toggleAudio() {
    const { api, stream, audio, audioEnabled } = this.state.get();

    if (stream) {
      await api.stream.toggleMedia({ audioEnabled });
    }

    audio?.stream
      .getAudioTracks()
      .forEach((audio: any) => (audio.enabled = !audioEnabled));

    return this.state.update({
      audioEnabled: !audioEnabled,
    });
  }

  async toggleParticipantMedia(
    user: string,
    { video, audio }: { video: boolean; audio: boolean }
  ) {
    return this.state.update((state) => {
      if (video !== undefined && state.videoStreams[user]) {
        state.videoStreams[user] = {
          ...state.videoStreams[user],
          enabled: video,
        };
      }

      if (audio !== undefined && state.audioStreams[user]) {
        state.audioStreams[user] = {
          ...state.videoStreams[user],
          enabled: audio,
        };
      }
    });
  }
}
