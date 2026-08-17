import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const overview = {
  householdName: 'Varley Household',
  payCycleLabel: '25 Jul - 25 Aug',
  unacknowledgedCount: 2,
  activeObligationCount: 3,
  partnerReviewCount: 1,
};

const pots = [
  {
    name: 'Food',
    owner: 'Household',
    remaining: 107.19,
    planned: 400,
    accent: '#D97706',
  },
  {
    name: 'Gift',
    owner: 'Sinking Fund',
    remaining: 69.04,
    planned: 250,
    accent: '#0F766E',
  },
  {
    name: 'Matt Fun',
    owner: 'Matt',
    remaining: 14.44,
    planned: 532.68,
    accent: '#2563EB',
  },
  {
    name: 'Contingency',
    owner: 'Household',
    remaining: -18.28,
    planned: 50,
    accent: '#B91C1C',
  },
];

const inboxItems = [
  {
    merchant: 'Tesco',
    amount: 42.18,
    meta: 'Joint · Food · needs acknowledgment',
    highlight: 'acknowledge',
  },
  {
    merchant: 'Zara',
    amount: 120,
    meta: 'AMEX · Kris · refund pending · split required',
    highlight: 'partner review',
  },
  {
    merchant: 'British Airways',
    amount: 199,
    meta: 'BA · Bali 2026 · acknowledged',
    highlight: 'done',
  },
];

const obligations = [
  {
    eventName: 'Charlotte Wedding',
    itemName: 'Gift',
    planned: 252.98,
    funded: 252.98,
    actual: 252.98,
    variance: 0,
    status: 'On budget',
  },
  {
    eventName: 'Kris Birthday',
    itemName: 'Gift',
    planned: 20,
    funded: 20,
    actual: 35,
    variance: 15,
    status: 'Over by 15.00',
  },
  {
    eventName: 'Bali 2026',
    itemName: 'Flights',
    planned: 1787,
    funded: 1787,
    actual: 199,
    variance: -1588,
    status: 'In progress',
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(value);
}

function SummaryTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Zero Sum Finance</Text>
          <Text style={styles.heroTitle}>{overview.householdName}</Text>
          <Text style={styles.heroSubtitle}>
            Phase 1 shell with mocked imported transactions, active obligations, and pot pressure.
          </Text>

          <View style={styles.summaryRow}>
            <SummaryTile value={overview.payCycleLabel} label="current cycle" />
            <SummaryTile value={String(overview.unacknowledgedCount)} label="needs action" />
            <SummaryTile value={String(overview.activeObligationCount)} label="active events" />
          </View>
        </View>

        <SectionHeading eyebrow="Inbox" title="Transaction pressure" />
        <View style={styles.card}>
          {inboxItems.map((item) => (
            <View key={`${item.merchant}-${item.amount}`} style={styles.listRow}>
              <View style={styles.listCopy}>
                <Text style={styles.rowTitle}>{item.merchant}</Text>
                <Text style={styles.rowMeta}>{item.meta}</Text>
              </View>
              <View style={styles.rowAside}>
                <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
                <Text
                  style={[
                    styles.badge,
                    item.highlight === 'done'
                      ? styles.badgeDone
                      : item.highlight === 'partner review'
                        ? styles.badgeWarn
                        : styles.badgeAlert,
                  ]}
                >
                  {item.highlight}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <SectionHeading eyebrow="Pots" title="Remaining this cycle" />
        <View style={styles.potGrid}>
          {pots.map((pot) => (
            <View key={pot.name} style={styles.potCard}>
              <View style={[styles.potAccent, { backgroundColor: pot.accent }]} />
              <Text style={styles.potName}>{pot.name}</Text>
              <Text style={styles.potOwner}>{pot.owner}</Text>
              <Text style={pot.remaining < 0 ? styles.potNegative : styles.potAmount}>
                {formatCurrency(pot.remaining)}
              </Text>
              <Text style={styles.potPlanned}>of {formatCurrency(pot.planned)}</Text>
            </View>
          ))}
        </View>

        <SectionHeading eyebrow="Events" title="Active obligations this month" />
        <View style={styles.obligationStack}>
          {obligations.map((obligation) => (
            <View key={`${obligation.eventName}-${obligation.itemName}`} style={styles.obligationCard}>
              <View style={styles.obligationHeader}>
                <View>
                  <Text style={styles.rowTitle}>{obligation.eventName}</Text>
                  <Text style={styles.rowMeta}>{obligation.itemName}</Text>
                </View>
                <Text style={obligation.variance > 0 ? styles.badgeAlertText : styles.badgeDoneText}>
                  {obligation.status}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <View>
                  <Text style={styles.metricLabel}>planned</Text>
                  <Text style={styles.metricValue}>{formatCurrency(obligation.planned)}</Text>
                </View>
                <View>
                  <Text style={styles.metricLabel}>funded</Text>
                  <Text style={styles.metricValue}>{formatCurrency(obligation.funded)}</Text>
                </View>
                <View>
                  <Text style={styles.metricLabel}>actual</Text>
                  <Text style={styles.metricValue}>{formatCurrency(obligation.actual)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerCallout}>
          <Text style={styles.footerTitle}>Next implementation slice</Text>
          <Text style={styles.footerBody}>
            Replace hard-coded mobile values with the mock API responses and add the first inbox acknowledgment flow.
          </Text>
          <Text style={styles.footerMeta}>
            Partner reviews pending now: {overview.partnerReviewCount}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#13342B',
  },
  container: {
    paddingBottom: 48,
    backgroundColor: '#F8F4E8',
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 26,
    backgroundColor: '#13342B',
  },
  kicker: {
    color: '#F3C677',
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  heroTitle: {
    color: '#FFF8EA',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 10,
  },
  heroSubtitle: {
    color: '#CCE0D7',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryTile: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#214A3D',
  },
  summaryValue: {
    color: '#FFF8EA',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    color: '#BED4C9',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  sectionHeading: {
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 12,
  },
  eyebrow: {
    color: '#9A5B13',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  sectionTitle: {
    color: '#17251F',
    fontSize: 24,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 24,
    borderRadius: 22,
    backgroundColor: '#FFFDF7',
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: '#E7DDC9',
  },
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  listCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: '#17251F',
    fontSize: 17,
    fontWeight: '700',
  },
  rowMeta: {
    color: '#5E6C65',
    fontSize: 13,
    lineHeight: 19,
  },
  rowAside: {
    alignItems: 'flex-end',
    gap: 8,
  },
  rowAmount: {
    color: '#17251F',
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  badgeAlert: {
    color: '#8D1F13',
    backgroundColor: '#FDE2DA',
  },
  badgeWarn: {
    color: '#8A4B08',
    backgroundColor: '#F8E2BF',
  },
  badgeDone: {
    color: '#155E53',
    backgroundColor: '#D9F4ED',
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
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E7DDC9',
  },
  potAccent: {
    width: 38,
    height: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  potName: {
    color: '#17251F',
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
    color: '#123E34',
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
    color: '#5E6C65',
    fontSize: 13,
  },
  obligationStack: {
    paddingHorizontal: 24,
    gap: 14,
  },
  obligationCard: {
    borderRadius: 22,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E7DDC9',
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
    color: '#17251F',
    fontSize: 16,
    fontWeight: '700',
  },
  footerCallout: {
    marginHorizontal: 24,
    marginTop: 28,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#F3C677',
    gap: 8,
  },
  footerTitle: {
    color: '#3D2A09',
    fontSize: 20,
    fontWeight: '700',
  },
  footerBody: {
    color: '#5F420D',
    fontSize: 14,
    lineHeight: 20,
  },
  footerMeta: {
    color: '#5F420D',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
