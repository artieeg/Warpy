import {useParticipantStore} from '@app/stores';
import {useMemo} from 'react';
import shallow from 'zustand/shallow';

export const useStreamSpeakers = (_stream: string) => {
  const participants = useParticipantStore(
    state => state.participants,
    shallow,
  );

  return useMemo(
    () =>
      participants.filter(p => p.role === 'speaker' || p.role === 'streamer'),
    [participants],
  );
};
