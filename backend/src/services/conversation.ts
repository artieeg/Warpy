import { IConnectMediaTransport, INewMediaTrack } from "@warpy/lib";
import { MediaService, MessageService, ParticipantService } from ".";

export const handleConnectTransport = async (data: IConnectMediaTransport) => {
  const { user } = data;
  const stream = await ParticipantService.getCurrentStreamFor(user);

  if (!stream) {
    return;
  }

  //const role = await ParticipantService.getRoleFor(user, stream);
  const node = await MediaService.getConsumerNodeFor(user);

  if (!node) {
    return;
  }

  MessageService.sendConnectTransport(node, data);
};

export const handleNewTrack = async (data: INewMediaTrack) => {
  const { user } = data;

  const stream = await ParticipantService.getCurrentStreamFor(user);

  if (!stream) {
    return;
  }

  const role = await ParticipantService.getRoleFor(user);

  if (role === "viewer") {
    return;
  }

  MessageService.sendNewTrack(data);
};
