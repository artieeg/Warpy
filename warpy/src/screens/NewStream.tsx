import {
  useAppUser,
  useLocalStream,
  useParticipantsCount,
  useSpeakingRequests,
  useStreamSpeakers,
  useStreamViewers,
} from '@app/hooks';
import {createStream} from '@app/services';
import {RTCView} from 'react-native-webrtc';
import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, useWindowDimensions} from 'react-native';
import {
  StopStream,
  Button,
  useMediaStreamingContext,
  useWebSocketContext,
  ParticipantsModal,
  ParticipantInfoModal,
} from '@app/components';
/*
import {
  consumeRemoteStream,
  initSendDevice,
  sendMediaStream,
} from '@app/services/video';
 */
import {useRecvTransport} from '@app/hooks/useRecvTransport';
import {StreamerPanel} from '@app/components/StreamerPanel';

export const NewStream = () => {
  const [streamId, setStreamId] = useState<string>();
  const [title, setTitle] = useState('test stream');
  const [hub, setHub] = useState('60ec569668b42c003304630b');
  const [user] = useAppUser();
  const userId: string = user!.id;
  const [sendRoomData, setSendRoomData] = useState<any>();
  const [recvRoomData, setRecvRoomData] = useState<any>();
  const [userSpeakRequest, setUserSpeakRequest] = useState<string>();
  const ws = useWebSocketContext();
  const media = useMediaStreamingContext();

  const recvTransport = useRecvTransport({
    stream: streamId,
    recvTransportOptions: recvRoomData?.recvTransportOptions,
    routerRtpCapabilities: recvRoomData?.routerRtpCapabilities,
  });

  const {width, height} = useWindowDimensions();
  const localStream = useLocalStream('video');

  useEffect(() => {
    ws.once('created-room', (data: any) => {
      setSendRoomData(data.media);
    });

    ws.once('@media/recv-connect-params', (data: any) => {
      setRecvRoomData(data);
    });

    const onRaiseHand = (data: any) => {
      setUserSpeakRequest(data.user);
    };

    ws.on('raise-hand', onRaiseHand);

    return () => {
      ws.off('raise-hand', onRaiseHand);
    };
  }, [streamId, ws]);

  useEffect(() => {
    if (!recvTransport) {
      return;
    }

    const onNewTrack = (data: any) => {
      media.consumeRemoteStream(
        data.consumerParameters,
        data.user,
        recvTransport,
      );
    };

    ws.on('@media/new-track', onNewTrack);

    return () => {
      ws.off('@media/new-track', onNewTrack);
    };
  }, [recvTransport, media, ws]);

  useEffect(() => {
    if (sendRoomData && streamId && localStream) {
      media
        .initSendDevice(sendRoomData.routerRtpCapabilities)
        .then(async () => {
          await media.sendMediaStream(
            localStream,
            streamId,
            sendRoomData,
            'video',
          );
        });
    }
  }, [streamId, sendRoomData, localStream, userId, media, ws]);

  const onStart = useCallback(async () => {
    const newStreamId = await createStream(title, hub);
    setStreamId(newStreamId);
  }, [title, hub]);

  const localStreamStyle = {
    ...styles.localStream,
    width,
    height,
  };

  const onAllowSpeaking = () => {
    ws.sendAllowSpeaker(streamId!, userSpeakRequest!);
    setUserSpeakRequest(undefined);
  };

  const onStopStream = () => {
    ws.sendStopStream({
      stream: streamId,
    });
  };

  const participantsCount = useParticipantsCount();
  const speakers = useStreamSpeakers(streamId!);
  const [viewers, fetchViewers] = useStreamViewers(streamId!);
  const [panelVisible, setPanelVisible] = useState(true);
  const usersRaisingHand = useSpeakingRequests(streamId!);

  return (
    <View>
      {localStream && (
        <RTCView
          objectFit="cover"
          style={localStreamStyle}
          streamURL={localStream.toURL()}
        />
      )}
      {streamId && <StopStream onPress={onStopStream} />}
      {streamId && (
        <StreamerPanel
          title={title}
          visible={panelVisible}
          speakers={speakers}
          participantsCount={participantsCount}
          onOpenParticipantsList={() => setPanelVisible(false)}
        />
      )}
      <ParticipantsModal
        speakers={speakers}
        raisingHands={usersRaisingHand}
        title={title}
        onHide={() => setPanelVisible(true)}
        visible={!panelVisible}
        viewers={viewers}
        onFetchMore={fetchViewers}
      />
      <ParticipantInfoModal participant={'test'} />

      {!streamId && (
        <View style={styles.startStreamButton}>
          <Button onPress={onStart} title="Start" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  localStream: {
    backgroundColor: '#303030',
  },
  allowSpeaking: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
  },
  startStreamButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
  },
});
