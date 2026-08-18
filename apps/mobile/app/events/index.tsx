// RF-SMART Elevate owns this file
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppShell, Hero, SectionHeading, SurfaceCard } from '../../src/components/layout';
import { ErrorBanner, LoadingState } from '../../src/components/status';
import { EventSummary, getEvents } from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/format';
import { useRouteRefresh } from '../../src/lib/route-refresh';
import { colors } from '../../src/lib/theme';

const recurrenceLabels: Record<string, string> = {
  'one-time': 'one-time',
  monthly: 'monthly',
  quarterly: 'quarterly',
  yearly: 'yearly',
};

export default function EventsScreen() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const payload = await getEvents();
      setEvents(payload.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected event load failure.');
    } finally {
      setIsLoading(false);
    }
  }

  useRouteRefresh('events', load);

  if (isLoading && events.length === 0) {
    return <LoadingState message="Loading event planner..." />;
  }

  return (
    <AppShell>
      <Hero title="Events" subtitle="Birthdays, holidays, and one-off plans can now be explored from the event side." />
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={load} /> : null}
      <View style={styles.actions}>
        <Link href="/events/new" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Create event</Text>
          </Pressable>
        </Link>
      </View>
      <SectionHeading eyebrow="Planner" title={`${events.length} current event records`} />
      <SurfaceCard>
        {events.map((item) => (
          <Link key={item.id} href={`/events/${item.id}`} asChild>
            <Pressable style={styles.row}>
              <View style={styles.copy}>
                <Text style={styles.title}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.type} · {item.status} · {recurrenceLabels[item.recurrenceRule] ?? item.recurrenceRule} · due {item.dueDate}{item.fundingPotName ? ` · ${item.fundingPotName}` : ''}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.amount}>{formatCurrency(item.plannedAmount)}</Text>
                <Text style={item.varianceStatus === 'over-budget' ? styles.alert : styles.good}>{item.varianceStatus}</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </SurfaceCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  actions: { paddingHorizontal: 24, marginBottom: 16, alignItems: 'flex-start' },
  primaryButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: colors.forest },
  primaryButtonText: { color: '#FFF8EA', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  copy: { flex: 1 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  meta: { color: colors.muted, fontSize: 13 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { color: colors.text, fontWeight: '700', fontSize: 16 },
  alert: { color: colors.red, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  good: { color: colors.teal, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
});
