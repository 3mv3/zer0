// RF-SMART Elevate owns this file
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppShell, Hero, SectionHeading, SurfaceCard } from '../../src/components/layout';
import { ErrorBanner, LoadingState } from '../../src/components/status';
import { AuditEntry, getAuditEntries } from '../../src/lib/api';
import { useRouteRefresh } from '../../src/lib/route-refresh';
import { colors } from '../../src/lib/theme';

export default function AuditScreen() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const payload = await getAuditEntries();
      setEntries(payload.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected audit load failure.');
    } finally {
      setIsLoading(false);
    }
  }

  useRouteRefresh('audit', load);

  if (isLoading && entries.length === 0) {
    return <LoadingState message="Loading audit log..." />;
  }

  return (
    <AppShell>
      <Hero title="Audit Log" subtitle="Track every important planning and transaction change made during Phase 1." />
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={load} /> : null}
      <SectionHeading eyebrow="History" title={`${entries.length} recent changes`} />
      <SurfaceCard>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.row}>
            <View style={styles.copy}>
              <Text style={styles.title}>{entry.summary}</Text>
              <Text style={styles.meta}>{entry.entityType} · {entry.action}</Text>
            </View>
            <Text style={styles.time}>{new Date(entry.createdUtc).toLocaleString()}</Text>
          </View>
        ))}
      </SurfaceCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  copy: { flex: 1, gap: 4 },
  title: { color: colors.text, fontWeight: '700', fontSize: 15 },
  meta: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7 },
  time: { color: colors.muted, fontSize: 12, maxWidth: 120, textAlign: 'right' },
});