import {INotification} from '@warpy/lib';
import {StoreSlice} from '../types';

export interface INotificationSlice {
  notifications: INotification[];
  addNotification: (notification: INotification) => void;
  removeNotification: (id: string) => void;
}

export const createNotificationSlice: StoreSlice<INotificationSlice> = (
  set,
  get,
) => ({
  notifications: [],
  addNotification(notification) {
    set({notifications: [notification, ...get().notifications]});
  },
  removeNotification(id) {
    set({
      notifications: get().notifications.filter(n => n.id !== id),
    });
  },
});
