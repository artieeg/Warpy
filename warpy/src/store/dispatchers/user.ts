import {Roles} from '@warpy/lib';
import {StoreSlice} from '../types';

export interface IUserDispatchers {
  dispatchUserRoleUpdate: (
    role: Roles,
    mediaPermissionToken: string,
    sendMediaParams?: any,
  ) => Promise<void>;
  dispatchUserLoadData: (token: string) => Promise<void>;
}

export const createUserDispatchers: StoreSlice<IUserDispatchers> = (
  set,
  get,
) => ({
  async dispatchUserLoadData(token) {
    const {api} = get();

    set({
      isLoadingUser: true,
    });

    const {user, following} = await api.user.auth(token);

    if (!user || !following) {
      set({
        isLoadingUser: false,
        exists: false,
      });

      return;
    }

    set({
      user,
      following,
      isLoadingUser: false,
    });
  },

  async dispatchUserRoleUpdate(role, mediaPermissionToken, sendMediaParams) {
    const oldRole = get().role;

    if (sendMediaParams) {
      set({sendMediaParams, role});
    } else {
      set({role});
    }

    if (role === 'viewer') {
      get().dispatchProducerClose(['audio', 'video']);
    } else if (role === 'speaker') {
      get().dispatchProducerClose(['video']);
    }

    if (oldRole === 'streamer' && role === 'speaker') {
      return;
    } else {
      const kind = role === 'speaker' ? 'audio' : 'video';
      await get().sendMedia(mediaPermissionToken, [kind]);
    }
  },
});