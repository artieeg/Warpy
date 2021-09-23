import { BlockDAO, ParticipantDAL, UserDAO } from "@backend/dal";
import { CacheService } from "./cache";
import Filter from "bad-words";
import { MINUTES_1, MINUTES_5, SECONDS_5 } from "@backend/constants";
import { BroadcastService } from "./broadcast";
import { IChatMessage } from "@warpy/lib";
import cuid from "cuid";

const cachedFindUser = CacheService.withCache(UserDAO.findById, {
  keyExtractor: ([id]) => id,
  prefix: "user",
  expiry: MINUTES_5,
});

const cachedGetCurrentStreamFor = CacheService.withCache(
  ParticipantDAL.getCurrentStreamFor,
  {
    keyExtractor: ([user]) => user,
    prefix: "current_stream",
    expiry: MINUTES_5,
  }
);

const cachedGetParticipantsByStream = CacheService.withCache(
  ParticipantDAL.getByStream,
  {
    keyExtractor: ([streamId]) => streamId,
    prefix: "stream_participants",
    expiry: SECONDS_5,
  }
);

const cachedGetBlockedIds = CacheService.withCache(BlockDAO.getBlockedUserIds, {
  keyExtractor: ([user]) => user,
  prefix: "blocked_user_ids",
  expiry: MINUTES_1,
});

const cachedGetBlockedByIds = CacheService.withCache(BlockDAO.getBlockedByIds, {
  keyExtractor: ([user]) => user,
  prefix: "blocked_by_ids",
  expiry: MINUTES_1,
});

const profanityFilter = new Filter();

const getFilteredMessage = (message: string): string => {
  return profanityFilter.clean(message);
};

const broadcastNewMessage = async (
  user_id: string,
  unfilteredMessage: string
) => {
  const user = await cachedFindUser(user_id);

  if (!user) {
    throw new Error("User not found");
  }

  const filteredMessage = getFilteredMessage(unfilteredMessage);

  const stream = await cachedGetCurrentStreamFor(user_id);

  if (!stream) {
    throw new Error("Not a stream participant");
  }

  const participants = await cachedGetParticipantsByStream(stream);
  const blockedByIds = await cachedGetBlockedByIds(user_id);
  const blockedIds = await cachedGetBlockedIds(user_id);

  const ids = participants
    .map((participant) => participant.id)
    .filter((id) => !blockedByIds.includes(id) && !blockedIds.includes(id));

  const message: IChatMessage = {
    id: cuid(),
    sender: user,
    message: filteredMessage,
    timestamp: Date.now(),
  };

  BroadcastService.broadcastNewMessage({
    targetUserIds: ids,
    message,
  });

  return message;
};

export const ChatService = {
  broadcastNewMessage,
};
