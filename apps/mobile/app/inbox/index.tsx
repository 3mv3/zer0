// RF-SMART Elevate owns this file
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppShell, Hero, SectionHeading, SurfaceCard } from '../../src/components/layout';
import { ErrorBanner, LoadingState } from '../../src/components/status';
import { getInbox, InboxResponse } from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/format';
import { colors } from '../../src/lib/theme';

export default function InboxScreen() {
  const [inbox, setInbox] = useState<InboxResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setInbox(await getInbox());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected inbox load failure.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (isLoading && !inbox) {
    return <LoadingState message="Loading inbox..." />;
  }

  return (
    <AppShell>
      <Hero title="Transaction Inbox" subtitle="Every imported transaction must be reviewed, funded, and acknowledged." />
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={load} /> : null}
      <SectionHeading eyebrow="Queue" title={`${inbox?.pending ?? 0} items still need action`} />
      <SurfaceCard>
        {(inbox?.items ?? []).map((item) => (
          <Link key={item.id} href={`/inbox/${item.id}`} asChild>
            <Pressable style={styles.row}>
              <View style={styles.copy}>
                <Text style={styles.title}>{item.merchant}</Text>
                <Text style={styles.meta}>
                  {item.accountName} · {item.category} · owner {item.owner}
                </Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                <Text style={item.isAcknowledged ? styles.good : styles.alert}>
                  {item.isAcknowledged ? 'acknowledged' : 'needs review'}
                </Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </SurfaceCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  alert: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  good: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
