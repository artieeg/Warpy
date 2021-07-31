import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Text} from './Text';
import {Avatar} from './Avatar';
import {Participant} from '@app/models';

interface IParticipantProps {
  data: Participant;
}

export const ParticipantDisplay = (props: IParticipantProps) => {
  const {data} = props;

  const name = `${data.first_name}`;

  return (
    <View style={styles.wrapper}>
      <Avatar user={data} style={styles.avatar} />
      <Text style={styles.name} size="xsmall" weight="bold">
        {name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 10,
    alignItems: 'center',
  },
  avatar: {
    marginRight: 12,
  },
  name: {
    marginTop: 6,
  },
});
