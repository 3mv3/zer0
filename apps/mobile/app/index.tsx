// RF-SMART Elevate owns this file
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppShell, Hero, SectionHeading, SummaryTile, SurfaceCard } from '../src/components/layout';
import { ErrorBanner, LoadingState } from '../src/components/status';
import { ActiveObligation, getInbox, getObligations, getOverview, InboxResponse, OverviewResponse } from '../src/lib/api';
import { formatCurrency } from '../src/lib/format';
import { useRouteRefresh } from '../src/lib/route-refresh';
import { colors, potAccentMap } from '../src/lib/theme';

export default function DashboardScreen() {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [inbox, setInbox] = useState<InboxResponse | null>(null);
  const [obligations, setObligations] = useState<ActiveObligation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [overviewPayload, inboxPayload, obligationsPayload] = await Promise.all([
        getOverview(),
        getInbox(),
        getObligations(),
      ]);

      setOverview(overviewPayload);
      setInbox(inboxPayload);
      setObligations(obligationsPayload.items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected dashboard load failure.');
    } finally {
      setIsLoading(false);
    }
  }

  useRouteRefresh('dashboard', load);

  if (isLoading && !overview) {
    return <LoadingState message="Loading dashboard..." />;
  }

  const pendingInbox = inbox?.pending ?? 0;
  const featuredPots = (overview?.pots ?? []).filter((pot) => pot.showOnDashboard && pot.kind === 'little-pot');

  return (
    <AppShell>
      <Hero
        title={overview?.household.name ?? 'Unavailable'}
        subtitle="Shared household view for current-cycle budget, transactions needing action, and active event obligations."
      />

      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={load} /> : null}

      <View style={styles.summaryRow}>
        <SummaryTile value={overview?.currentPayCycle.label ?? '--'} label="current cycle" />
        <SummaryTile value={String(pendingInbox)} label="needs action" href="/inbox" />
        <SummaryTile value={String(obligations.length)} label="active events" />
      </View>

      <SectionHeading eyebrow="Pots" title="Remaining this cycle" />
      <View style={styles.sectionActionRow}>
        <Link href="/pots" asChild>
          <Pressable style={styles.inlineLink}>
            <Text style={styles.inlineLinkText}>Choose visible pots</Text>
          </Pressable>
        </Link>
      </View>
      <View style={styles.potGrid}>
        {featuredPots.map((pot) => (
          <View key={pot.id} style={styles.potCard}>
            <View style={[styles.potAccent, { backgroundColor: potAccentMap[pot.kind] ?? colors.muted }]} />
            <Text style={styles.potName}>{pot.name}</Text>
            <Text style={styles.potOwner}>{pot.owner}</Text>
            <Text style={pot.remainingAmount < 0 ? styles.potNegative : styles.potAmount}>
              {formatCurrency(pot.remainingAmount)}
            </Text>
            <Text style={styles.potPlanned}>of {formatCurrency(pot.plannedAmount)}</Text>
          </View>
        ))}
        {featuredPots.length === 0 ? (
          <SurfaceCard>
            <Text style={styles.emptyTitle}>No featured pots selected</Text>
            <Text style={styles.emptyCopy}>Open Pots and mark the balances you want surfaced on the dashboard.</Text>
          </SurfaceCard>
        ) : null}
      </View>

      <SectionHeading eyebrow="Events" title="Active obligations this month" />
      <View style={styles.stack}>
        {obligations.map((obligation) => (
          <Link key={obligation.id} href={`/events/${obligation.eventId}`} asChild>
            <Pressable style={styles.obligationCard}>
              <View style={styles.obligationHeader}>
                <View>
                  <Text style={styles.rowTitle}>{obligation.eventName}</Text>
                  <Text style={styles.rowMeta}>{obligation.itemName}</Text>
                </View>
                <Text style={obligation.varianceAmount > 0 ? styles.badgeAlertText : styles.badgeDoneText}>
                  {obligation.varianceStatus}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <View>
                  <Text style={styles.metricLabel}>planned</Text>
                  <Text style={styles.metricValue}>{formatCurrency(obligation.plannedAmount)}</Text>
                </View>
                <View>
                  <Text style={styles.metricLabel}>funded</Text>
                  <Text style={styles.metricValue}>{formatCurrency(obligation.fundedAmount)}</Text>
                </View>
                <View>
                  <Text style={styles.metricLabel}>actual</Text>
                  <Text style={styles.metricValue}>{formatCurrency(obligation.actualAmount)}</Text>
                </View>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    marginTop: -8,
  },
  sectionActionRow: {
    paddingHorizontal: 24,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  inlineLink: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#EFE5D1',
  },
  inlineLinkText: {
    color: '#694812',
    fontWeight: '700',
  },
  potGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: 24,
  },
  potCard: {
    width: '47%',
    minHeight: 140,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  potAccent: {
    width: 38,
    height: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  potName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  potOwner: {
    color: '#6B786E',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  potAmount: {
    color: colors.forest,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  potNegative: {
    color: '#9F1D1D',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  potPlanned: {
    color: colors.muted,
    fontSize: 13,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  stack: {
    paddingHorizontal: 24,
    gap: 14,
  },
  obligationCard: {
    borderRadius: 22,
    backgroundColor: colors.creamSoft,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
  },
  obligationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  badgeAlertText: {
    color: '#9F1D1D',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  badgeDoneText: {
    color: '#155E53',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricLabel: {
    color: '#6B786E',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  metricValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
