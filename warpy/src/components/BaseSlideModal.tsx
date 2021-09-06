import React from 'react';
import {StyleSheet, View, ViewProps} from 'react-native';
import Modal from 'react-native-modal';
import {Text} from './Text';

interface IParticipanModalProps extends ViewProps {
  title?: string;
  visible: boolean;
  onHide: () => void;
  children: React.ReactNode;
}

export const BaseSlideModal = (props: IParticipanModalProps) => {
  const {visible, onHide, children, title, style} = props;

  return (
    <Modal
      removeClippedSubviews={false}
      hideModalContentWhileAnimating
      useNativeDriver
      useNativeDriverForBackdrop
      propagateSwipe={true}
      onSwipeComplete={() => {
        onHide();
      }}
      swipeDirection={['down']}
      swipeThreshold={100}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      hasBackdrop={false}
      style={styles.modalStyle}
      isVisible={visible}>
      <View style={[styles.wrapper, style]}>
        <View style={styles.handler} />
        {title && (
          <Text weight="bold" style={[styles.title, styles.horizontalPadding]}>
            {title}
          </Text>
        )}

        {children}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalStyle: {
    margin: 0,
  },
  wrapper: {
    backgroundColor: '#000',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 40,
  },
  horizontalPadding: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    marginBottom: 10,
    marginTop: 20,
  },
  title: {},
  handler: {
    position: 'absolute',
    alignSelf: 'center',
    width: 50,
    height: 5,
    top: 22,
    borderRadius: 12,
    backgroundColor: '#474141',
  },
});
