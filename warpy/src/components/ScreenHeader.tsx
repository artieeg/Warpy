import React, {useCallback, useMemo} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {Text} from './Text';
import {OpenNotificationsButton} from './OpenNotificationsButton';
import {StartNewStreamButton} from './StartNewStreamButton';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Avatar} from './Avatar';
import {useAppUser} from '@app/hooks';
import {OpenHomeButton} from './OpenHomeButton';

export const ScreenHeader = () => {
  const user = useAppUser();
  const navigation = useNavigation();

  const route = useRoute();

  const title = useMemo(() => {
    const titles = {
      Feed: '/feed',
      Notifications: '/news',
      MainSettingsScreen: '/you',
      User: '/user',
    };

    return titles[route.name as keyof typeof titles];
  }, [route.name]);

  const onOpenSettings = useCallback(() => {
    navigation.navigate('MainSettingsScreen');
  }, [navigation]);

  const onOpenNotifications = useCallback(() => {
    navigation.navigate('Notifications');
  }, [navigation]);

  const onStartStream = useCallback(() => {
    navigation.navigate('NewStream');
  }, [navigation]);

  const onOpenFeed = useCallback(() => {
    navigation.navigate('Feed');
  }, [navigation]);

  const button = useMemo(
    () =>
      route.name === 'Feed' ? (
        <OpenNotificationsButton
          style={styles.headerButton}
          onPress={onOpenNotifications}
        />
      ) : (
        <OpenHomeButton style={styles.headerButton} onPress={onOpenFeed} />
      ),
    [route.name],
  );

  return (
    <View style={styles.header}>
      <Text size="large" weight="extraBold">
        {title}
      </Text>
      <View style={styles.row}>
        {button}

        <StartNewStreamButton
          style={styles.headerButton}
          onPress={onStartStream}
        />
        <TouchableOpacity onPress={onOpenSettings}>
          <Avatar user={user!} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 10,
  },
});
