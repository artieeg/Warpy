import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, useWindowDimensions} from 'react-native';
import {IUser} from '@warpy/lib';
import {Avatar} from './Avatar';
import {Text} from './Text';
import {Checkbox} from './Checkbox';
import {useStore} from '@app/store';

interface IUserInviteProps {
  user: IUser;
}

const useUserInviteOptionController = (user: IUser) => {
  const sentInvites = useStore(store => store.sentInvites);

  const isAlreadyInvited = React.useMemo(() => {
    const invites = Object.values(sentInvites);

    return !!invites.find(invite => invite.invitee.id === user.id);
  }, [sentInvites, user]);

  const [invited, setInvited] = useState(isAlreadyInvited);

  useEffect(() => {
    if (invited) {
      useStore.getState().dispatchPendingInvite(user.id);
    } else {
      useStore.getState().dispatchCancelInvite(user.id);
    }
  }, [invited, user.id]);

  console.log({sentInvites});

  const onInviteToggle = useCallback(() => {
    console.log({isAlreadyInvited});

    if (!isAlreadyInvited) {
      setInvited(prev => !prev);
    }
  }, [isAlreadyInvited]);

  return {invited, onInviteToggle};
};

export const UserInviteOption = ({user}: IUserInviteProps) => {
  const {invited, onInviteToggle} = useUserInviteOptionController(user);
  const {width} = useWindowDimensions();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.user, {width: width - 160}]}>
        <Avatar user={user} />
        <View style={[styles.info]}>
          <Text size="small" weight="bold">
            {user.first_name}
          </Text>
          <Text color="boulder" weight="bold" size="xsmall">
            {user.username}
          </Text>
        </View>
      </View>
      <Checkbox visible={invited} onToggle={onInviteToggle} />
    </View>
  );
};

const styles = StyleSheet.create({
  user: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrapper: {
    flexDirection: 'row',
    paddingHorizontal: 30,
    paddingBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  info: {
    marginLeft: 20,
  },
});
