import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {IChatMessage} from '@warpy/lib';
import {Avatar} from './Avatar';
import {Text} from './Text';

interface IChatMessageProps {
  message: IChatMessage;
}

export const ChatMessage = React.memo((props: IChatMessageProps) => {
  const {sender, message} = props.message;

  return (
    <TouchableOpacity style={styles.wrapper}>
      <Avatar style={styles.avatar} size="small" user={sender} />
      <View style={styles.text}>
        <Text size="xsmall" weight="bold" color="info">
          {sender.username}
        </Text>

        <Text size="xsmall" weight="bold">
          Yeah sure, I mean if you spend all day shuffling words around you can
          make anything sound bad, Morty
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    paddingBottom: 10,
    paddingHorizontal: 30,
    width: '100%',
  },
  avatar: {
    marginTop: 5,
    marginRight: 10,
  },
  text: {
    flex: 1,
  },
});
