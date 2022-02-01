import React from 'react';
import {BaseSlideModal} from './BaseSlideModal';
import {FlatList, StyleSheet, useWindowDimensions, View} from 'react-native';
import {ReactionButton} from './ReactionButton';
import {reactionCodes} from './Reaction';
import {useStore} from '@app/store';

const ReactionContainer = (props: any) => {
  const {width} = useWindowDimensions();

  const side = (width - 20 * 2) / 5;

  const style = {
    width: side,
    height: side,
    alignItems: 'center',
    justifyContent: 'center',
  };

  return <View {...props} style={style} />;
};

interface IReactionsProps {
  visible: boolean;
}

export const Reactions = (props: IReactionsProps) => {
  const {visible} = props;
  const dispatchReactionChange = useStore.use.dispatchReactionChange();
  const dispatchModalClose = useStore.use.dispatchModalClose();

  return (
    <BaseSlideModal
      onClose={() => dispatchModalClose()}
      visible={visible}
      title="pick your reaction">
      <FlatList
        style={styles.list}
        numColumns={5}
        data={reactionCodes}
        keyExtractor={item => item}
        renderItem={({item}) => (
          <ReactionContainer>
            <ReactionButton
              onPress={() => {
                dispatchReactionChange(item);
                dispatchModalClose();
              }}
              code={item}
            />
          </ReactionContainer>
        )}
      />
    </BaseSlideModal>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 20,
  },
});
