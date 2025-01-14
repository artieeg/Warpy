import {UserBase} from '@warpy/lib';
import {Participant} from '@warpy/lib';

export const createUserFixture = (data?: Partial<UserBase>): UserBase => {
  return {
    id: 'test-id',
    username: 'test username',
    isAnon: false,
    avatar: 'vvatar',
    first_name: 'Test',
    last_name: 'Name',
    ...data,
  };
};

export const createParticipantFixture = (
  data?: Partial<Participant>,
): Participant => {
  return {
    ...createUserFixture(data),
    role: 'viewer',
    stream: 'test',
    isRaisingHand: false,
    isBanned: false,
    isBot: false,
    ...data,
  };
};
