import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import {Text} from './Text';
import {BaseSlideModal, BaseSlideModalRefProps} from './BaseSlideModal';
import {useDispatcher} from '@app/store';

export interface IActionSheetProps {
  actions: (IActionButtonProps | null)[];
  onHide?: () => any;
}

export interface IActionButtonProps extends TouchableOpacityProps {
  title: string;
  color?: 'red' | 'green';
}

export const ActionSheetButton = (props: IActionButtonProps) => {
  const {title, color} = props;

  return (
    <TouchableOpacity
      {...props}
      style={[styles.button, styles.bottomBorder, props.style]}
    >
      <Text size="small" color={color || 'red'} weight="bold">
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export const ActionSheet = React.forwardRef<
  BaseSlideModalRefProps,
  IActionSheetProps
>((props, ref) => {
  const {actions, onHide} = props;

  const filteredActions = actions.filter(
    action => action !== null,
  ) as IActionButtonProps[];

  const dispatch = useDispatcher();

  return (
    <BaseSlideModal ref={ref}>
      <View>
        <View style={[styles.background, styles.actions]}>
          {filteredActions.map(({title, color, onPress}) => (
            <ActionSheetButton
              title={title}
              color={color}
              onPress={e => {
                dispatch(({modal}) => modal.close());
                if (onPress) {
                  onPress(e);
                }
              }}
              key={title}
            />
          ))}
        </View>
        <TouchableOpacity
          onPress={() => {
            onHide?.();
          }}
          style={[styles.background, styles.cancel, styles.button]}
        >
          <Text size="small" weight="bold">
            cancel
          </Text>
        </TouchableOpacity>
      </View>
    </BaseSlideModal>
  );
});

const styles = StyleSheet.create({
  background: {
    borderRadius: 10,
    backgroundColor: '#000',
  },
  actions: {
    marginBottom: 10,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  cancel: {},
  modal: {
    padding: 30,
    margin: 0,
    justifyContent: 'flex-end',
  },
  bottomBorder: {
    borderBottomWidth: 1,
    borderColor: '#101010',
  },
});
