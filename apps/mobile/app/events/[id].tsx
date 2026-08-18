// RF-SMART Elevate owns this file
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppShell, Hero, SectionHeading, SurfaceCard } from '../../src/components/layout';
import { OptionSelect, OptionSelectItem } from '../../src/components/option-select';
import { ErrorBanner, LoadingState } from '../../src/components/status';
import { EventDetail, getEvent, getPots, updateEvent } from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/format';
import { triggerRouteRefresh } from '../../src/lib/route-refresh';
import { colors } from '../../src/lib/theme';

const noFundingPotValue = '__none__';
const recurrenceOptions: OptionSelectItem[] = [
  { label: 'One-time', value: 'one-time' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Yearly', value: 'yearly' },
];
const recurrenceLabels: Record<string, string> = {
  'one-time': 'one-time',
  monthly: 'monthly',
  quarterly: 'quarterly',
  yearly: 'yearly',
};

type EditorState = {
  status: string;
  recurrenceRule: EventDetail['recurrenceRule'];
  fundingPotId: string;
  plannedAmount: string;
  fundedAmount: string;
  notes: string;
};

function toEditor(item: EventDetail): EditorState {
  return {
    status: item.status,
    recurrenceRule: item.recurrenceRule,
    fundingPotId: item.fundingPotId ?? noFundingPotValue,
    plannedAmount: item.plannedAmount.toFixed(2),
    fundedAmount: item.fundedAmount.toFixed(2),
    notes: item.notes,
  };
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [bigPotOptions, setBigPotOptions] = useState<OptionSelectItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    if (!id) {
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      const [payload, pots] = await Promise.all([getEvent(id), getPots()]);
      setBigPotOptions(pots.items
        .filter((pot) => pot.kind === 'big-pot')
        .map((pot) => ({ label: pot.name, value: pot.id })));
      setDetail(payload);
      setEditor(toEditor(payload));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected event load failure.');
    } finally {
      setIsLoading(false);
    }
  }

  async function save() {
    if (!id || !editor) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      const payload = await updateEvent(id, {
        status: editor.status,
        recurrenceRule: editor.recurrenceRule,
        fundingPotId: editor.fundingPotId === noFundingPotValue ? null : editor.fundingPotId,
        plannedAmount: Number(editor.plannedAmount || '0'),
        fundedAmount: Number(editor.fundedAmount || '0'),
        notes: editor.notes,
      });
      setDetail(payload);
      setEditor(toEditor(payload));
      triggerRouteRefresh('events');
      triggerRouteRefresh('audit');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected event save failure.');
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (isLoading && !detail) {
    return <LoadingState message="Loading event detail..." />;
  }

  if (!detail || !editor) {
    return <LoadingState message="Event unavailable." />;
  }

  return (
    <AppShell>
      <Hero title={detail.name} subtitle="Track the event from forecast to active obligation and compare actuals against the plan." />
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={load} /> : null}
      <SectionHeading eyebrow="Summary" title={`${detail.type} · ${detail.status} · ${recurrenceLabels[detail.recurrenceRule] ?? detail.recurrenceRule}`} />
      <SurfaceCard>
        <Text style={styles.meta}>Due {detail.dueDate} · spend window {detail.spendWindowStart} to {detail.spendWindowEnd}</Text>
        <Text style={styles.meta}>Big pot {detail.fundingPotName ?? 'not linked'}</Text>
        <View style={styles.metricRow}>
          <Metric label="planned" value={formatCurrency(detail.plannedAmount)} />
          <Metric label="funded" value={formatCurrency(detail.fundedAmount)} />
          <Metric label="actual" value={formatCurrency(detail.actualAmount)} />
        </View>
      </SurfaceCard>

      <SectionHeading eyebrow="Edit" title="Plan from the event side" />
      <SurfaceCard>
        <Text style={styles.label}>Status</Text>
        <TextInput style={styles.input} value={editor.status} onChangeText={(value) => setEditor((current) => current ? { ...current, status: value } : current)} />
        <OptionSelect
          label="Recurrence"
          value={editor.recurrenceRule}
          options={recurrenceOptions}
          onChange={(value) => setEditor((current) => current ? { ...current, recurrenceRule: value as EditorState['recurrenceRule'] } : current)}
        />
        <OptionSelect
          label="Big pot"
          value={editor.fundingPotId}
          options={[{ label: 'No linked big pot', value: noFundingPotValue } as OptionSelectItem, ...bigPotOptions]}
          onChange={(value) => setEditor((current) => current ? { ...current, fundingPotId: value } : current)}
        />
        <Text style={styles.label}>Planned amount</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={editor.plannedAmount} onChangeText={(value) => setEditor((current) => current ? { ...current, plannedAmount: value } : current)} />
        <Text style={styles.label}>Funded amount</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={editor.fundedAmount} onChangeText={(value) => setEditor((current) => current ? { ...current, fundedAmount: value } : current)} />
        <Text style={styles.label}>Notes</Text>
        <TextInput style={styles.notes} multiline value={editor.notes} onChangeText={(value) => setEditor((current) => current ? { ...current, notes: value } : current)} />
        <Text style={styles.meta}>Recurring events can model monthly, quarterly, or yearly bills that keep drawing from the same big pot over time.</Text>
        <Pressable style={styles.primaryButton} onPress={save} disabled={isSaving}>
          <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save event'}</Text>
        </Pressable>
      </SurfaceCard>

      <SectionHeading eyebrow="Items" title="Budget lines" />
      <SurfaceCard>
        {detail.items.length === 0 ? <Text style={styles.emptyState}>No budget lines yet.</Text> : null}
        {detail.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemMeta}>{item.status}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemAmount}>{formatCurrency(item.actualAmount)}</Text>
              <Text style={styles.itemMeta}>planned {formatCurrency(item.plannedAmount)}</Text>
            </View>
          </View>
        ))}
      </SurfaceCard>
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  meta: { color: colors.muted, fontSize: 13 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  metricLabel: { color: '#6B786E', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  metricValue: { color: colors.text, fontSize: 16, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFCF4', color: colors.text, fontSize: 15 },
  notes: { minHeight: 96, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFCF4', color: colors.text, fontSize: 15, textAlignVertical: 'top' },
  primaryButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: colors.forest, alignSelf: 'flex-start' },
  primaryButtonText: { color: '#FFF8EA', fontWeight: '700' },
  emptyState: { color: colors.muted, fontSize: 14 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  itemTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  itemMeta: { color: colors.muted, fontSize: 12 },
  itemRight: { alignItems: 'flex-end' },
  itemAmount: { color: colors.text, fontWeight: '700', fontSize: 15 },
});
