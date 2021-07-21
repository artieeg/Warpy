import { MessageService } from "@ws_gateway/services";
import { Handler } from "@ws_gateway/types";

export const onConnectTransport: Handler = (data, context?) => {
  const user = context?.user;
  console.log(`user ${user} connects transport`, data);

  if (!user) {
    return;
  }

  const eventData = {
    ...data,
    user,
  };

  const { isProducer } = data;
  console.log("is producer", isProducer);

  MessageService.sendTransportConnect(eventData, isProducer);
};
