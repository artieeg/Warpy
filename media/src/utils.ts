import jwt from "jsonwebtoken";
import { MediaPermissions, TransportOptions } from "@warpy/lib";
import { WebRtcTransport } from "mediasoup/node/lib/types";

export const getMediaPermissions = (token: string) => {
  return jwt.verify(token, process.env.MEDIA_JWT_SECRET!) as MediaPermissions;
};

export const verifyMediaPermissions = (
  token: string,
  fieldsToCheck: Partial<MediaPermissions>
) => {
  const permissions: any = getMediaPermissions(token);

  Object.entries(fieldsToCheck).forEach(([field, value]) => {
    if (permissions[field] !== value && permissions[field] !== true) {
      throw new Error("Permission value doesn't match");
    }
  });

  return permissions;
};

export const getOptionsFromTransport = (
  transport: WebRtcTransport
): TransportOptions => ({
  id: transport.id,
  iceParameters: transport.iceParameters,
  iceCandidates: transport.iceCandidates,
  dtlsParameters: transport.dtlsParameters,
});
