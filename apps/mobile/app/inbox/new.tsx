// RF-SMART Elevate owns this file
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { AppShell, Hero, SectionHeading, SurfaceCard } from '../../src/components/layout';
import { ErrorBanner } from '../../src/components/status';
import { createTransaction } from '../../src/lib/api';
import { triggerRouteRefresh } from '../../src/lib/route-refresh';
import { colors } from '../../src/lib/theme';

type SplitEditor = {
  id: string;
  category: string;
  fundingSource: string;
  amountText: string;
  notes: string;
};

type EditorState = {
  accountName: string;
  merchant: string;
  amountText: string;
  transactionDate: string;
  sourceProvider: string;
  externalTransactionId: string;
  category: string;
  fundingSource: string;
  owner: string;
  requiresPartnerReview: boolean;
  isAcknowledged: boolean;
  isSplit: boolean;
  refundPending: boolean;
  notes: string;
  splits: SplitEditor[];
};

function createLocalSplit(defaults?: Partial<SplitEditor>): SplitEditor {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    category: '',
    fundingSource: '',
    amountText: '0.00',
    notes: '',
    ...defaults,
  };
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function NewTransactionScreen() {
  const [editor, setEditor] = useState<EditorState>({
    accountName: 'Joint',
    merchant: '',
    amountText: '0.00',
    transactionDate: getToday(),
    sourceProvider: 'manual',
    externalTransactionId: '',
    category: 'Unassigned',
    fundingSource: 'Food',
    owner: 'Household',
    requiresPartnerReview: false,
    isAcknowledged: false,
    isSplit: false,
    refundPending: false,
    notes: '',
    splits: [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function save() {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload = await createTransaction({
        accountName: editor.accountName,
        merchant: editor.merchant,
        amount: Number(editor.amountText || '0'),
        transactionDate: editor.transactionDate,
        sourceProvider: editor.sourceProvider,
        externalTransactionId: editor.externalTransactionId,
        category: editor.category,
        fundingSource: editor.fundingSource,
        owner: editor.owner,
        requiresPartnerReview: editor.requiresPartnerReview,
        isAcknowledged: editor.isAcknowledged,
        isSplit: editor.isSplit,
        refundPending: editor.refundPending,
        notes: editor.notes,
        splits: editor.isSplit
          ? editor.splits.map((split) => ({
            category: split.category,
            fundingSource: split.fundingSource,
            amount: Number(split.amountText || '0'),
            notes: split.notes,
          }))
          : [],
      });

      triggerRouteRefresh('inbox');
      triggerRouteRefresh('dashboard');
      triggerRouteRefresh('audit');
      router.replace(`/inbox/${payload.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected transaction create failure.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <Hero title="Import Transaction" subtitle="Seed the inbox with a provider-shaped transaction even before real bank sync arrives in Phase 3." />
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={save} /> : null}
      <SectionHeading eyebrow="New import" title="Create inbox pressure" />
      <SurfaceCard>
        <Text style={styles.label}>Merchant</Text>
        <TextInput style={styles.input} value={editor.merchant} onChangeText={(value) => setEditor((current) => ({ ...current, merchant: value }))} />
        <View style={styles.formRow}>
          <View style={styles.field}>
            <Text style={styles.label}>Amount</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={editor.amountText} onChangeText={(value) => setEditor((current) => ({ ...current, amountText: value }))} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Date</Text>
            <TextInput style={styles.input} value={editor.transactionDate} onChangeText={(value) => setEditor((current) => ({ ...current, transactionDate: value }))} />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={styles.field}>
            <Text style={styles.label}>Account</Text>
            <TextInput style={styles.input} value={editor.accountName} onChangeText={(value) => setEditor((current) => ({ ...current, accountName: value }))} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Owner</Text>
            <TextInput style={styles.input} value={editor.owner} onChangeText={(value) => setEditor((current) => ({ ...current, owner: value }))} />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={styles.field}>
            <Text style={styles.label}>Source provider</Text>
            <TextInput style={styles.input} value={editor.sourceProvider} onChangeText={(value) => setEditor((current) => ({ ...current, sourceProvider: value }))} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>External id</Text>
            <TextInput style={styles.input} value={editor.externalTransactionId} onChangeText={(value) => setEditor((current) => ({ ...current, externalTransactionId: value }))} />
          </View>
        </View>
        <View style={styles.formRow}>
          <View style={styles.field}>
            <Text style={styles.label}>Category</Text>
            <TextInput style={styles.input} value={editor.category} onChangeText={(value) => setEditor((current) => ({ ...current, category: value }))} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Funding source</Text>
            <TextInput style={styles.input} value={editor.fundingSource} onChangeText={(value) => setEditor((current) => ({ ...current, fundingSource: value }))} />
          </View>
        </View>
        <View style={styles.toggleRow}><Text style={styles.label}>Partner review</Text><Switch value={editor.requiresPartnerReview} onValueChange={(value) => setEditor((current) => ({ ...current, requiresPartnerReview: value }))} /></View>
        <View style={styles.toggleRow}><Text style={styles.label}>Acknowledged</Text><Switch value={editor.isAcknowledged} onValueChange={(value) => setEditor((current) => ({ ...current, isAcknowledged: value }))} /></View>
        <View style={styles.toggleRow}><Text style={styles.label}>Split transaction</Text><Switch value={editor.isSplit} onValueChange={(value) => setEditor((current) => ({
          ...current,
          isSplit: value,
          splits: value && current.splits.length === 0
            ? [createLocalSplit({ category: current.category, fundingSource: current.fundingSource, amountText: current.amountText, notes: current.notes })]
            : current.splits,
        }))} /></View>
        <View style={styles.toggleRow}><Text style={styles.label}>Refund pending</Text><Switch value={editor.refundPending} onValueChange={(value) => setEditor((current) => ({ ...current, refundPending: value }))} /></View>
        <Text style={styles.label}>Notes</Text>
        <TextInput style={styles.notes} multiline value={editor.notes} onChangeText={(value) => setEditor((current) => ({ ...current, notes: value }))} />

        {editor.isSplit ? (
          <>
            <Text style={styles.label}>Split lines</Text>
            {editor.splits.map((split) => (
              <View key={split.id} style={styles.splitCard}>
                <TextInput style={styles.input} value={split.category} onChangeText={(value) => setEditor((current) => ({ ...current, splits: current.splits.map((item) => item.id === split.id ? { ...item, category: value } : item) }))} placeholder="Category" placeholderTextColor={colors.muted} />
                <TextInput style={styles.input} value={split.fundingSource} onChangeText={(value) => setEditor((current) => ({ ...current, splits: current.splits.map((item) => item.id === split.id ? { ...item, fundingSource: value } : item) }))} placeholder="Funding source" placeholderTextColor={colors.muted} />
                <TextInput style={styles.input} keyboardType="decimal-pad" value={split.amountText} onChangeText={(value) => setEditor((current) => ({ ...current, splits: current.splits.map((item) => item.id === split.id ? { ...item, amountText: value } : item) }))} placeholder="Amount" placeholderTextColor={colors.muted} />
                <TextInput style={styles.input} value={split.notes} onChangeText={(value) => setEditor((current) => ({ ...current, splits: current.splits.map((item) => item.id === split.id ? { ...item, notes: value } : item) }))} placeholder="Notes" placeholderTextColor={colors.muted} />
                <Pressable style={styles.removeButton} onPress={() => setEditor((current) => ({ ...current, splits: current.splits.length > 1 ? current.splits.filter((item) => item.id !== split.id) : current.splits }))}>
                  <Text style={styles.removeButtonText}>Remove split</Text>
                </Pressable>
              </View>
            ))}
          </>
        ) : null}

        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={() => setEditor((current) => ({
            ...current,
            isSplit: true,
            splits: current.splits.length === 0
              ? [createLocalSplit({ category: current.category, fundingSource: current.fundingSource, amountText: current.amountText, notes: current.notes })]
              : [...current.splits, createLocalSplit()],
          }))}>
            <Text style={styles.secondaryButtonText}>Add split line</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={save} disabled={isSaving}>
            <Text style={styles.primaryButtonText}>{isSaving ? 'Creating...' : 'Create transaction'}</Text>
          </Pressable>
        </View>
      </SurfaceCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  formRow: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 8 },
  label: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFCF4', color: colors.text, fontSize: 15 },
  notes: { minHeight: 96, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFCF4', color: colors.text, fontSize: 15, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  splitCard: { gap: 10, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 16, backgroundColor: '#FCF6EA' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  secondaryButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: '#EFE5D1' },
  secondaryButtonText: { color: '#694812', fontWeight: '700' },
  removeButton: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FDE2DA' },
  removeButtonText: { color: '#8D1F13', fontWeight: '700', fontSize: 12 },
  primaryButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: colors.forest },
  primaryButtonText: { color: '#FFF8EA', fontWeight: '700' },
});