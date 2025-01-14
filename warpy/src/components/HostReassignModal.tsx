import React, {useMemo, useState} from 'react';
import {StyleSheet, FlatList} from 'react-native';
import {Participant} from '@warpy/lib';
import {BaseSlideModal, IBaseModalProps} from './BaseSlideModal';
import {useDispatcher, useStoreShallow} from '@app/store';
import {HostCandidate} from './HostCandidate';
import {TextButton} from '@warpy/components';
import {navigation} from '@app/navigation';
import {useModalRef} from '@app/hooks/useModalRef';

export const HostReassignModal: React.FC<IBaseModalProps> = props => {
  const ref = useModalRef('host-reassign');

  const [api, stream, user, streamers, closeAfterReassign] = useStoreShallow(
    state => [
      state.api,
      state.stream,
      state.user,
      state.streamers,
      state.modalCloseAfterHostReassign,
    ],
  );

  const dispatch = useDispatcher();

  const hostCandidates = useMemo(
    () => Object.values(streamers).filter(u => u.id !== user!.id),
    [streamers],
  );

  const [selected, setSelected] = useState<string>();

  const onHostReassign = React.useCallback(async () => {
    if (selected && stream) {
      await dispatch(({stream}) => stream.reassign(selected));

      if (closeAfterReassign) {
        await dispatch(({stream: stream_s}) =>
          stream_s.leave({
            shouldStopStream: true,
            stream,
          }),
        );

        navigation.current?.navigate('Feed');
      }
    }
  }, [selected, api, stream, closeAfterReassign]);

  const onSelect = React.useCallback((id: string) => {
    setSelected(prev => {
      if (prev === id) {
        return undefined;
      } else {
        return id;
      }
    });
  }, []);

  const renderHostCandidate = React.useCallback(
    ({item}: {item: Participant}) => {
      return (
        <HostCandidate
          selected={selected === item.id}
          data={item}
          onPress={onSelect}
        />
      );
    },
    [selected],
  );

  return (
    <BaseSlideModal
      {...props}
      ref={ref}
      style={styles.modal}
      title="reassign host"
    >
      <FlatList
        data={hostCandidates}
        renderItem={renderHostCandidate}
        contentContainerStyle={styles.container}
      />

      <TextButton
        onPress={onHostReassign}
        style={styles.button}
        title="reassign"
        disabled={!selected}
      />
    </BaseSlideModal>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  modal: {
    height: '60%',
  },
  button: {
    marginHorizontal: 30,
    marginTop: 10,
    marginBottom: 20,
  },
});
