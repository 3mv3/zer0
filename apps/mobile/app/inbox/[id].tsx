// RF-SMART Elevate owns this file
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AppShell, Hero, SectionHeading, SurfaceCard } from '../../src/components/layout';
import { ErrorBanner, LoadingState } from '../../src/components/status';
import { getTransaction, TransactionDetail, TransactionUpdateRequest, updateTransaction } from '../../src/lib/api';
import { formatCurrency } from '../../src/lib/format';
import { triggerRouteRefresh } from '../../src/lib/route-refresh';
import { colors } from '../../src/lib/theme';

type EditorState = {
  category: string;
  fundingSource: string;
  owner: string;
  notes: string;
  isAcknowledged: boolean;
  isSplit: boolean;
  refundPending: boolean;
  splits: Array<{
    id: string;
    category: string;
    fundingSource: string;
    amountText: string;
    notes: string;
  }>;
};

function createLocalSplit(defaults?: Partial<EditorState['splits'][number]>) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: '',
    fundingSource: '',
    amountText: '0.00',
    notes: '',
    ...defaults,
  };
}

function toEditor(detail: TransactionDetail): EditorState {
  return {
    category: detail.category,
    fundingSource: detail.fundingSource,
    owner: detail.owner,
    notes: detail.notes,
    isAcknowledged: detail.isAcknowledged,
    isSplit: detail.isSplit,
    refundPending: detail.refundPending,
    splits: detail.splits.map((split) => ({
      id: split.id,
      category: split.category,
      fundingSource: split.fundingSource,
      amountText: split.amount.toFixed(2),
      notes: split.notes,
    })),
  };
}

function toRequest(editor: EditorState): TransactionUpdateRequest {
  return {
    category: editor.category,
    fundingSource: editor.fundingSource,
    owner: editor.owner,
    isSplit: editor.isSplit,
    refundPending: editor.refundPending,
    isAcknowledged: editor.isAcknowledged,
    notes: editor.notes,
    splits: editor.isSplit
      ? editor.splits.map((split) => ({
        category: split.category,
        fundingSource: split.fundingSource,
        amount: Number(split.amountText || '0'),
        notes: split.notes,
      }))
      : [],
  };
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
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
      const payload = await getTransaction(id);
      setDetail(payload);
      setEditor(toEditor(payload));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected transaction load failure.');
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
      const payload = await updateTransaction(id, toRequest(editor));
      setDetail(payload);
      setEditor(toEditor(payload));
      triggerRouteRefresh('inbox');
      triggerRouteRefresh('dashboard');
      triggerRouteRefresh('audit');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected transaction save failure.');
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (isLoading && !detail) {
    return <LoadingState message="Loading transaction detail..." />;
  }

  if (!detail || !editor) {
    return <LoadingState message="Transaction unavailable." />;
  }

  return (
    <AppShell>
      <Hero title={detail.merchant} subtitle="Review, split, and acknowledge this imported transaction." />
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={load} /> : null}
      <SectionHeading eyebrow="Detail" title={`${detail.accountName} · ${formatCurrency(detail.amount)}`} />
      <SurfaceCard>
        {(detail.sourceProvider || detail.externalTransactionId) ? (
          <View style={styles.sourceCard}>
            <Text style={styles.sourceText}>provider {detail.sourceProvider || 'manual'} · ref {detail.externalTransactionId || 'n/a'}</Text>
          </View>
        ) : null}
        <View style={styles.formRow}>
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <TextInput style={styles.input} value={editor.category} onChangeText={(value) => setEditor((current) => current ? { ...current, category: value } : current)} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Funding source</Text>
            <TextInput style={styles.input} value={editor.fundingSource} onChangeText={(value) => setEditor((current) => current ? { ...current, fundingSource: value } : current)} />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Owner</Text>
          <TextInput style={styles.input} value={editor.owner} onChangeText={(value) => setEditor((current) => current ? { ...current, owner: value } : current)} />
        </View>
        <View style={styles.toggleRow}><Text style={styles.label}>Acknowledged</Text><Switch value={editor.isAcknowledged} onValueChange={(value) => setEditor((current) => current ? { ...current, isAcknowledged: value } : current)} /></View>
        <View style={styles.toggleRow}><Text style={styles.label}>Split transaction</Text><Switch value={editor.isSplit} onValueChange={(value) => setEditor((current) => current ? {
          ...current,
          isSplit: value,
          splits: value && current.splits.length === 0
            ? [createLocalSplit({ category: current.category, fundingSource: current.fundingSource, amountText: detail.amount.toFixed(2), notes: current.notes })]
            : current.splits,
        } : current)} /></View>
        <View style={styles.toggleRow}><Text style={styles.label}>Refund pending</Text><Switch value={editor.refundPending} onValueChange={(value) => setEditor((current) => current ? { ...current, refundPending: value } : current)} /></View>
        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput style={styles.notes} multiline value={editor.notes} onChangeText={(value) => setEditor((current) => current ? { ...current, notes: value } : current)} />
        </View>

        {editor.isSplit ? (
          <>
            <Text style={styles.label}>Split lines</Text>
            {editor.splits.map((split) => (
              <View key={split.id} style={styles.splitCard}>
                <TextInput style={styles.input} value={split.category} onChangeText={(value) => setEditor((current) => current ? { ...current, splits: current.splits.map((item) => item.id === split.id ? { ...item, category: value } : item) } : current)} />
                <TextInput style={styles.input} value={split.fundingSource} onChangeText={(value) => setEditor((current) => current ? { ...current, splits: current.splits.map((item) => item.id === split.id ? { ...item, fundingSource: value } : item) } : current)} />
                <TextInput style={styles.input} keyboardType="decimal-pad" value={split.amountText} onChangeText={(value) => setEditor((current) => current ? { ...current, splits: current.splits.map((item) => item.id === split.id ? { ...item, amountText: value } : item) } : current)} />
                <TextInput style={styles.input} value={split.notes} onChangeText={(value) => setEditor((current) => current ? { ...current, splits: current.splits.map((item) => item.id === split.id ? { ...item, notes: value } : item) } : current)} />
                <Pressable style={styles.removeButton} onPress={() => setEditor((current) => current ? { ...current, splits: current.splits.length > 1 ? current.splits.filter((item) => item.id !== split.id) : current.splits } : current)}>
                  <Text style={styles.removeButtonText}>Remove split</Text>
                </Pressable>
              </View>
            ))}
            <Pressable style={styles.secondaryButton} onPress={() => setEditor((current) => current ? { ...current, splits: [...current.splits, createLocalSplit()] } : current)}>
              <Text style={styles.secondaryButtonText}>Add split line</Text>
            </Pressable>
          </>
        ) : null}
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => setEditor(toEditor(detail))}><Text style={styles.secondaryButtonText}>Reset</Text></Pressable>
          <Pressable style={styles.primaryButton} onPress={save} disabled={isSaving}><Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save'}</Text></Pressable>
        </View>
      </SurfaceCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  formRow: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 8 },
  sourceCard: { padding: 12, borderRadius: 14, backgroundColor: '#F2E9D8' },
  sourceText: { color: '#694812', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '700' },
  label: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFCF4', color: colors.text, fontSize: 15 },
  notes: { minHeight: 96, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFCF4', color: colors.text, fontSize: 15, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  splitCard: { gap: 10, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: '#FCF6EA' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  secondaryButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: '#EFE5D1' },
  secondaryButtonText: { color: '#694812', fontWeight: '700' },
  removeButton: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FDE2DA' },
  removeButtonText: { color: '#8D1F13', fontWeight: '700', fontSize: 12 },
  primaryButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: colors.forest },
  primaryButtonText: { color: '#FFF8EA', fontWeight: '700' },
});
