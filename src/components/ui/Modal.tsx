import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Platform,
  useWindowDimensions,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme, spacing, radius } from '../../core/theme';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
  contentStyle?: StyleProp<ViewStyle>;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  maxWidth = 520,
  contentStyle,
}) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWebOrDesktop = Platform.OS === 'web' || width >= 640;

  return (
    <RNModal
      animationType={isWebOrDesktop ? 'fade' : 'slide'}
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, isWebOrDesktop && styles.overlayCentered]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.content,
                isWebOrDesktop ? styles.contentCentered : styles.contentBottomSheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.surfaceBorder,
                  maxWidth: isWebOrDesktop ? maxWidth : '100%',
                },
                contentStyle,
              ]}
            >
              <View style={styles.header}>
                {title ? (
                  <Text style={[styles.title, { color: colors.textPrimary }]}>
                    {title}
                  </Text>
                ) : (
                  <View />
                )}
                <TouchableOpacity
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: colors.surfaceHover }]}
                >
                  <X color={colors.textSecondary} size={18} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.body}
              >
                {children}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  overlayCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  content: {
    width: '100%',
    borderWidth: 1,
    padding: spacing.xl,
    ...(Platform.OS === 'web'
      ? {
          boxShadow:
            '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        }
      : {
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
        }),
  },
  contentCentered: {
    borderRadius: radius.lg,
    maxHeight: '90%',
  },
  contentBottomSheet: {
    marginTop: 'auto',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomWidth: 0,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 6,
    borderRadius: radius.full,
  },
  body: {
    maxHeight: 520,
  },
});
