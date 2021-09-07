import { ALLOWED_EMOJI } from "@warpy/lib";
import { MediaClient } from "@warpykit-sdk/client";
import { UserRecord } from "../types";
import { createRecvTransport } from "../utils";

export const joinStream = async (streamId: string, record: UserRecord) => {
  const { api, recvDevice, sendDevice } = record;

  const {
    speakers,
    count,
    raisedHands,
    mediaPermissionsToken,
    recvMediaParams,
  } = await record.api.stream.join(streamId);

  const { routerRtpCapabilities, recvTransportOptions } = recvMediaParams;

  console.log(`joined room with ${count} viewers`);

  record.media = MediaClient({
    recvDevice,
    sendDevice,
    permissionsToken: mediaPermissionsToken,
    api,
  });

  const transport = await createRecvTransport({
    stream: streamId,
    routerRtpCapabilities,
    recvTransportOptions,
    record,
  });

  if (process.env.MODE === "LOADTEST") {
    //TODO: Consuming VP8 streams causes memory leak in aiortc apparently
    const consumers = await record.media.consumeRemoteStreams(
      record.user.id,
      streamId,
      transport
    );

    record.consumers = consumers;
  }

  api.stream.onReactionsUpdate((data) => {
    console.log("reactions update", data);
  });

  setInterval(() => {
    api.stream.react(
      streamId,
      ALLOWED_EMOJI[Math.floor(Math.random() * ALLOWED_EMOJI.length)]
    );
  }, 800 + Math.random() * 800);

  record.stream = streamId;
  record.role = "viewer";

  //Listen to new media tracks
  api.media.onNewTrack((data) => {
    record.media?.consumeRemoteStream(
      data.consumerParameters,
      data.user,
      transport
    );
  });
};
