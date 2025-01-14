import {
  RtpCodecCapability,
  TransportListenIp,
  WorkerLogTag,
} from "mediasoup/node/lib/types";

export const config = {
  httpIp: "0.0.0.0",

  mediasoup: {
    worker: {
      rtcMinPort: 40000,
      rtcMaxPort: 49999,
      logLevel: "debug",
      logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"] as WorkerLogTag[],
    },
    router: {
      mediaCodecs: [
        {
          kind: "audio",
          mimeType: "audio/opus",
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: "video",
          mimeType: "video/H264",
          clockRate: 90000,
          preferredPayloadType: 101,
          rtcpFeedback: [
            { type: "nack" },
            { type: "nack", parameter: "pli" },
            { type: "ccm", parameter: "fir" },
            { type: "goog-remb" },
          ],
          parameters: {
            "level-asymmetry-allowed": 1,
            "packetization-mode": 1,
            "profile-level-id": "4d0032",
          },
        },

        /*
        {
          kind: "video",
          mimeType: "video/vp9",
          clockRate: 90000,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
        */
        {
          kind: "video",
          mimeType: "video/vp8",
          clockRate: 90000,
          parameters: {
            "x-google-start-bitrate": 1000,
          },
        },
      ] as RtpCodecCapability[],
    },

    webRtcTransport: {
      listenIps: [
        {
          ip: process.env.MEDIASOUP_IP,
          announcedIp: process.env.MEDIASOUP_IP,
        },
      ] as TransportListenIp[],
      initialAvailableOutgoingBitrate: 800000,
    },

    plainRtpTransport: {
      listenIp: {
        ip: process.env.MEDIASOUP_IP as string,
        announcedIp: process.env.MEDIASOUP_IP as string,
      },
      rtcpMux: true,
      comedia: false,
    },
  },
} as const;
