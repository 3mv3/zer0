// RF-SMART Elevate owns this file
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';

export function LoadingState({ message }: { message: string }) {
  return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={colors.gold} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorTitle}>Validation issue</Text>
      <Text style={styles.errorBody}>{message}</Text>
      <Pressable onPress={onRetry}>
        <Text style={styles.retryText}>Retry load</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.forest,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    color: '#FFF8EA',
    fontSize: 15,
    textAlign: 'center',
  },
  errorBanner: {
    marginHorizontal: 24,
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: '#FDE2DA',
    padding: 16,
    gap: 8,
  },
  errorTitle: {
    color: '#8D1F13',
    fontSize: 16,
    fontWeight: '700',
  },
  errorBody: {
    color: '#8D1F13',
    fontSize: 14,
    lineHeight: 20,
  },
  retryText: {
    color: '#8D1F13',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
