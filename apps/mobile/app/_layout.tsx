// RF-SMART Elevate owns this file
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="audit/index" />
      <Stack.Screen name="inbox/index" />
      <Stack.Screen name="inbox/new" />
      <Stack.Screen name="inbox/[id]" />
      <Stack.Screen name="events/index" />
      <Stack.Screen name="events/new" />
      <Stack.Screen name="events/[id]" />
    </Stack>
  );
}
