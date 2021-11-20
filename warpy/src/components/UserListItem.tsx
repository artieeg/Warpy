import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {IUser, UserList} from '@warpy/lib';
import {UserGeneralInfo} from './UserGeneralInfo';
import {SmallTextButton} from './SmallTextButton';
import {useStore} from '@app/store';

interface BaseUserListItemProps {
  user: IUser;
  list: UserList;
}

interface ActionProps {
  user: IUser;
}

const FollowingItemAction = ({user}: ActionProps) => {
  const [isFollowing, dispatchFollowingAdd, dispatchFollowingRemove] = useStore(
    state => [
      state.following.includes(user.id),
      state.dispatchFollowingAdd,
      state.dispatchFollowingRemove,
    ],
  );

  return (
    <SmallTextButton
      title={isFollowing ? 'unfollow' : 'follow'}
      onPress={() => {
        if (!isFollowing) {
          dispatchFollowingAdd(user.id);
        } else {
          dispatchFollowingRemove(user.id);
        }
      }}
    />
  );
};

const BlockItemAction = ({user}: ActionProps) => {
  const [isBlocked, setBlocked] = useState(true);
  const api = useStore.use.api();

  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    if (isBlocked) {
      api.user.block(user.id);
    } else {
      api.user.unblock(user.id);
    }
  }, [isBlocked]);

  return (
    <SmallTextButton
      title={isBlocked ? 'unblock' : 'block'}
      onPress={() => setBlocked(prev => !prev)}
    />
  );
};

export const UserListItem = ({user, list}: BaseUserListItemProps) => {
  return (
    <View style={styles.wrapper}>
      <UserGeneralInfo user={user} avatar={{size: 'large'}} />
      {(list === 'followers' || list === 'following') && (
        <FollowingItemAction user={user} />
      )}

      {list === 'blocked' && <BlockItemAction user={user} />}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});