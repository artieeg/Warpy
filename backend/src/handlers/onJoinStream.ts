import { StreamService } from "@backend/services";
import { IJoinStreamResponse, IJoinStream, MessageHandler } from "@warpy/lib";

export const onJoinStream: MessageHandler<IJoinStream, IJoinStreamResponse> =
  async (data, respond) => {
    const { stream, user } = data;

    const response = await StreamService.addNewViewer(stream, user);

    respond(response);
  };
