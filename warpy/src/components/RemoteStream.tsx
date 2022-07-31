import React, {useEffect} from 'react';
import {StyleSheet, View} from 'react-native';
import {StreamOverlay} from './StreamOverlay';
import {Room} from './Room';
import {useKickHandler} from '@app/hooks';
import {AwardDisplay} from './AwardDisplay';
import {Stream} from '@warpy/lib';
import {useDispatcher, useStore} from '@app/store';
import {useDebounce} from 'use-debounce/lib';
import {LoadingOverlay} from './LoadingOverlay';

interface IRemoteStreamProps {
  stream: Stream;
}

export const RemoteStream = (props: IRemoteStreamProps) => {
  const {id} = props.stream;

  const _isJoined = useStore(state => state.stream !== null);
  const [isJoined] = useDebounce(_isJoined, 1000);

  const dispatch = useDispatcher();

  useEffect(() => {
    if (id) {
      dispatch(({stream}) => stream.join({stream: id}));
    }
  }, [id]);

  useKickHandler();

  return (
    <View style={styles.wrapper}>
      <Room />
      <AwardDisplay />
      <StreamOverlay />
      <LoadingOverlay enabled={!isJoined} mode="stream-join" />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#000',
    flex: 1,
  },
});
