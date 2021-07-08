import "module-alias/register";

import {
  ConversationService,
  MessageService,
  ParticipantService,
} from "@app/services";
import "module-alias/register";

const main = async () => {
  await Promise.all([MessageService.init(), ParticipantService.init()]);

  MessageService.on(
    "conversation-new",
    ConversationService.handleNewConversation
  );
  MessageService.on(
    "conversation-end",
    ConversationService.handleConversationEnd
  );
  MessageService.on(
    "participant-new",
    ConversationService.handleParticipantJoin
  );
  MessageService.on(
    "participant-leave",
    ConversationService.handleParticipantLeave
  );
};

main();