// RF-SMART Elevate owns this file
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AppShell, Hero, SectionHeading, SurfaceCard } from '../../src/components/layout';
import { OptionSelect, OptionSelectItem } from '../../src/components/option-select';
import { ErrorBanner } from '../../src/components/status';
import { createPot, getOverview } from '../../src/lib/api';
import { triggerRouteRefresh } from '../../src/lib/route-refresh';
import { colors } from '../../src/lib/theme';

const potKinds: OptionSelectItem[] = [
  { label: 'Little pot', value: 'little-pot' },
  { label: 'Big pot', value: 'big-pot' },
];
const overspendRules = ['block', 'allow-with-review', 'allow'];

export default function NewPotScreen() {
  const [ownerOptions, setOwnerOptions] = useState<string[]>(['Household']);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'big-pot' | 'little-pot'>('little-pot');
  const [plannedAmountText, setPlannedAmountText] = useState('0.00');
  const [owner, setOwner] = useState('Household');
  const [overspendRule, setOverspendRule] = useState(overspendRules[0]);
  const [carryForwardEnabled, setCarryForwardEnabled] = useState(true);
  const [showOnDashboard, setShowOnDashboard] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const amountLabel = kind === 'big-pot' ? 'Regular contribution' : 'Cycle budget';

  useEffect(() => {
    async function loadOwners() {
      try {
        const overview = await getOverview();
        const owners = Array.from(new Set(['Household', overview.household.ownerName, overview.household.partnerName].filter(Boolean)));
        setOwnerOptions(owners);
        setOwner((current) => owners.includes(current) ? current : owners[0]);
      } catch {
        setOwnerOptions(['Household']);
      }
    }

    void loadOwners();
  }, []);

  async function save() {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      await createPot({
        name,
        kind,
        plannedAmount: Number(plannedAmountText || '0'),
        owner,
        overspendRule,
        carryForwardEnabled,
        showOnDashboard,
      });

      triggerRouteRefresh('pots');
      triggerRouteRefresh('dashboard');
      triggerRouteRefresh('audit');
      router.replace('/pots');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected pot create failure.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <Hero title="Create Pot" subtitle="Choose whether this is a little pot for cycle budgeting or a big pot for longer-range reserve funding." />
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={save} /> : null}
      <SectionHeading eyebrow="New Pot" title="Define scope and visibility" />
      <SurfaceCard>
        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>
        <OptionSelect label="Kind" value={kind} options={potKinds} onChange={(value) => setKind(value === 'big-pot' ? 'big-pot' : 'little-pot')} />
        <View style={styles.field}>
          <Text style={styles.label}>{amountLabel}</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={plannedAmountText} onChangeText={setPlannedAmountText} />
        </View>
        <OptionSelect label="Owner" value={owner} options={ownerOptions} onChange={setOwner} />
        <OptionSelect label="Overspend rule" value={overspendRule} options={overspendRules} onChange={setOverspendRule} />
        <View style={styles.toggleRow}><Text style={styles.label}>Carry forward</Text><Switch value={carryForwardEnabled} onValueChange={setCarryForwardEnabled} /></View>
        <View style={styles.toggleRow}><Text style={styles.label}>Show on dashboard</Text><Switch value={showOnDashboard} onValueChange={setShowOnDashboard} /></View>
        <Text style={styles.hint}>
          {kind === 'big-pot'
            ? 'Use big pots for annual reserves like the sinking fund. Forecasting and event allocations land in the next backend slice.'
            : 'Use little pots for normal cycle or weekly budgets that drive remaining-this-cycle decisions.'}
        </Text>
        <Pressable style={styles.primaryButton} onPress={save} disabled={isSaving}>
          <Text style={styles.primaryButtonText}>{isSaving ? 'Creating...' : 'Create pot'}</Text>
        </Pressable>
      </SurfaceCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
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