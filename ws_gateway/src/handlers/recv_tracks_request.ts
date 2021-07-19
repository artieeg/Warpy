import { MessageService } from "@ws_gateway/services";
import { Handler } from "@ws_gateway/types";

export const onRecvTracksRequest: Handler = (data, context?) => {
  const user = context?.user;

  if (!user) {
    return;
  }

  const eventData = {
    ...data,
    user,
  };

  console.log("recv tracks request", eventData);

  MessageService.sendRecvTracksRequest(eventData);
};
