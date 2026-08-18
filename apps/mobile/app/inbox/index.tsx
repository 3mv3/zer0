// RF-SMART Elevate owns this file
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppShell, Hero, SectionHeading, SurfaceCard } from '../../src/components/layout';
import { ErrorBanner, LoadingState } from '../../src/components/status';
import { getInbox, InboxResponse } from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/format';
import { useRouteRefresh } from '../../src/lib/route-refresh';
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

  useRouteRefresh('inbox', load);

  if (isLoading && !inbox) {
    return <LoadingState message="Loading transactions..." />;
  }

  const actionableItems = (inbox?.items ?? []).filter((item) => !item.isAcknowledged);
  const historicalItems = (inbox?.items ?? []).filter((item) => item.isAcknowledged);

  return (
    <AppShell>
      <Hero title="Transactions" subtitle="Action the transactions that still need decisions, then refer back to the acknowledged history below." />
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={load} /> : null}
      <View style={styles.actions}>
        <Link href="/inbox/new" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Add transaction</Text>
          </Pressable>
        </Link>
      </View>
      <SectionHeading eyebrow="Needs Action" title={`${actionableItems.length} transactions still need action`} />
      <SurfaceCard>
        {actionableItems.length === 0 ? (
          <Text style={styles.emptyCopy}>Everything is acknowledged right now.</Text>
        ) : actionableItems.map((item) => (
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
                <Text style={item.requiresPartnerReview ? styles.warn : styles.alert}>
                  {item.requiresPartnerReview ? 'partner review' : 'needs review'}
                </Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </SurfaceCard>

      <SectionHeading eyebrow="History" title={`${historicalItems.length} acknowledged transactions`} />
      <SurfaceCard>
        {historicalItems.length === 0 ? (
          <Text style={styles.emptyCopy}>Acknowledged transactions will collect here once they are actioned.</Text>
        ) : historicalItems.map((item) => (
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
                <Text style={styles.good}>acknowledged</Text>
              </View>
            </Pressable>
          </Link>
        ))}
      </SurfaceCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.forest,
  },
  primaryButtonText: {
    color: '#FFF8EA',
    fontWeight: '700',
  },
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
  warn: {
    color: colors.amber,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
