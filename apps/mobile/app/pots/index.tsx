// RF-SMART Elevate owns this file
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AppShell, Hero, SectionHeading, SurfaceCard } from '../../src/components/layout';
import { ErrorBanner, LoadingState } from '../../src/components/status';
import { getPots, Pot, updatePot } from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/format';
import { triggerRouteRefresh, useRouteRefresh } from '../../src/lib/route-refresh';
import { colors, potAccentMap } from '../../src/lib/theme';

type PotEditor = {
  id: string;
  name: string;
  kind: Pot['kind'];
  owner: string;
  plannedAmountText: string;
  actualAmount: number;
  remainingAmount: number;
  showOnDashboard: boolean;
  isSaving: boolean;
};

function toEditor(pot: Pot): PotEditor {
  return {
    id: pot.id,
    name: pot.name,
    kind: pot.kind,
    owner: pot.owner,
    plannedAmountText: pot.plannedAmount.toFixed(2),
    actualAmount: pot.actualAmount,
    remainingAmount: pot.remainingAmount,
    showOnDashboard: pot.showOnDashboard,
    isSaving: false,
  };
}

export default function PotsScreen() {
  const [pots, setPots] = useState<PotEditor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const payload = await getPots();
      setPots(payload.items.map(toEditor));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected pot load failure.');
    } finally {
      setIsLoading(false);
    }
  }

  async function savePot(potId: string) {
    const current = pots.find((pot) => pot.id === potId);

    if (!current) {
      return;
    }

    try {
      setPots((items) => items.map((item) => item.id === potId ? { ...item, isSaving: true } : item));
      setErrorMessage(null);

      const updated = await updatePot(potId, {
        plannedAmount: Number(current.plannedAmountText || '0'),
        showOnDashboard: current.showOnDashboard,
      });

      setPots((items) => items.map((item) => item.id === potId ? toEditor(updated) : item));
      triggerRouteRefresh('pots');
      triggerRouteRefresh('dashboard');
      triggerRouteRefresh('audit');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected pot save failure.');
      setPots((items) => items.map((item) => item.id === potId ? { ...item, isSaving: false } : item));
    }
  }

  useRouteRefresh('pots', load);

  if (isLoading && pots.length === 0) {
    return <LoadingState message="Loading pots..." />;
  }

  const littlePots = pots.filter((pot) => pot.kind === 'little-pot');
  const bigPots = pots.filter((pot) => pot.kind === 'big-pot');

  return (
    <AppShell>
      <Hero title="Pots" subtitle="Little pots handle cycle budgets. Big pots hold longer-range reserves such as the sinking fund and will gain forecasting next." />
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={load} /> : null}
      <View style={styles.actions}>
        <Link href="/pots/new" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Create pot</Text>
          </Pressable>
        </Link>
      </View>
      <SectionHeading eyebrow="Little Pots" title="Cycle-budgeted pots" />
      <View style={styles.stack}>
        {littlePots.map((pot) => (
          <SurfaceCard key={pot.id}>
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <View style={[styles.accent, { backgroundColor: potAccentMap[pot.kind] ?? colors.muted }]} />
                <View>
                  <Text style={styles.title}>{pot.name}</Text>
                  <Text style={styles.meta}>{pot.owner} · little pot</Text>
                </View>
              </View>
              <Text style={pot.remainingAmount < 0 ? styles.negative : styles.amount}>{formatCurrency(pot.remainingAmount)}</Text>
            </View>

            <View style={styles.metricsRow}>
              <View>
                <Text style={styles.metricLabel}>spent</Text>
                <Text style={styles.metricValue}>{formatCurrency(pot.actualAmount)}</Text>
              </View>
              <View>
                <Text style={styles.metricLabel}>remaining</Text>
                <Text style={styles.metricValue}>{formatCurrency(pot.remainingAmount)}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Cycle budget</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={pot.plannedAmountText}
                onChangeText={(value) => setPots((items) => items.map((item) => item.id === pot.id ? { ...item, plannedAmountText: value } : item))}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.label}>Show on dashboard</Text>
              <Switch
                value={pot.showOnDashboard}
                onValueChange={(value) => setPots((items) => items.map((item) => item.id === pot.id ? { ...item, showOnDashboard: value } : item))}
              />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.hint}>Featured little pots appear in the dashboard remaining-this-cycle panel.</Text>
              <Pressable style={styles.primaryButton} onPress={() => savePot(pot.id)} disabled={pot.isSaving}>
                <Text style={styles.primaryButtonText}>{pot.isSaving ? 'Saving...' : 'Save pot'}</Text>
              </Pressable>
            </View>
          </SurfaceCard>
        ))}
      </View>

      <SectionHeading eyebrow="Big Pots" title="Longer-range reserve pots" />
      <View style={styles.stack}>
        {bigPots.map((pot) => (
          <SurfaceCard key={pot.id}>
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <View style={[styles.accent, { backgroundColor: potAccentMap[pot.kind] ?? colors.muted }]} />
                <View>
                  <Text style={styles.title}>{pot.name}</Text>
                  <Text style={styles.meta}>{pot.owner} · big pot</Text>
                </View>
              </View>
              <Text style={pot.remainingAmount < 0 ? styles.negative : styles.amount}>{formatCurrency(pot.remainingAmount)}</Text>
            </View>

            <View style={styles.metricsRow}>
              <View>
                <Text style={styles.metricLabel}>spent this cycle</Text>
                <Text style={styles.metricValue}>{formatCurrency(pot.actualAmount)}</Text>
              </View>
              <View>
                <Text style={styles.metricLabel}>current tracked balance</Text>
                <Text style={styles.metricValue}>{formatCurrency(pot.remainingAmount)}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Regular contribution</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={pot.plannedAmountText}
                onChangeText={(value) => setPots((items) => items.map((item) => item.id === pot.id ? { ...item, plannedAmountText: value } : item))}
              />
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.label}>Show on dashboard</Text>
              <Switch
                value={pot.showOnDashboard}
                onValueChange={(value) => setPots((items) => items.map((item) => item.id === pot.id ? { ...item, showOnDashboard: value } : item))}
              />
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.hint}>Big-pot forecasting and event allocation views land in the next persistence slice. This screen establishes the contract now.</Text>
              <Pressable style={styles.primaryButton} onPress={() => savePot(pot.id)} disabled={pot.isSaving}>
                <Text style={styles.primaryButtonText}>{pot.isSaving ? 'Saving...' : 'Save pot'}</Text>
              </Pressable>
            </View>
          </SurfaceCard>
        ))}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stack: {
    paddingHorizontal: 24,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  titleWrap: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  accent: {
    width: 8,
    borderRadius: 999,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  amount: {
    color: colors.forest,
    fontSize: 20,
    fontWeight: '700',
  },
  negative: {
    color: colors.red,
    fontSize: 20,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metricValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFCF4',
    color: colors.text,
    fontSize: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRow: {
    gap: 12,
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.forest,
  },
  primaryButtonText: {
    color: '#FFF8EA',
    fontWeight: '700',
  },
});