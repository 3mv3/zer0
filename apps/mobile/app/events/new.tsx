// RF-SMART Elevate owns this file
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { AppShell, Hero, SectionHeading, SurfaceCard } from '../../src/components/layout';
import { ErrorBanner } from '../../src/components/status';
import { createEvent } from '../../src/lib/api';
import { triggerRouteRefresh } from '../../src/lib/route-refresh';
import { colors } from '../../src/lib/theme';

type EditorState = {
  name: string;
  type: string;
  status: string;
  dueDate: string;
  spendWindowStart: string;
  spendWindowEnd: string;
  plannedAmount: string;
  fundedAmount: string;
  notes: string;
  tagsText: string;
};

function getDateInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  return date.toISOString().slice(0, 10);
}

export default function NewEventScreen() {
  const [editor, setEditor] = useState<EditorState>({
    name: '',
    type: 'event',
    status: 'planned',
    dueDate: getDateInputValue(30),
    spendWindowStart: getDateInputValue(0),
    spendWindowEnd: getDateInputValue(30),
    plannedAmount: '0.00',
    fundedAmount: '0.00',
    notes: '',
    tagsText: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function save() {
    if (!editor.name.trim()) {
      setErrorMessage('Name is required.');
      return;
    }

    if (!editor.type.trim()) {
      setErrorMessage('Type is required.');
      return;
    }

    if (!editor.status.trim()) {
      setErrorMessage('Status is required.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload = await createEvent({
        name: editor.name.trim(),
        type: editor.type.trim(),
        status: editor.status.trim(),
        dueDate: editor.dueDate,
        spendWindowStart: editor.spendWindowStart,
        spendWindowEnd: editor.spendWindowEnd,
        plannedAmount: Number(editor.plannedAmount || '0'),
        fundedAmount: Number(editor.fundedAmount || '0'),
        notes: editor.notes,
        tags: editor.tagsText
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      triggerRouteRefresh('events');
      triggerRouteRefresh('audit');
      router.replace(`/events/${payload.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected event create failure.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <Hero title="Create Event" subtitle="Capture a new holiday, birthday, or one-off obligation before spend starts landing in the current month." />
      {errorMessage ? <ErrorBanner message={errorMessage} onRetry={save} /> : null}
      <SectionHeading eyebrow="New record" title="Seed the event planner" />
      <SurfaceCard>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={editor.name} onChangeText={(value) => setEditor((current) => ({ ...current, name: value }))} />
        <Text style={styles.label}>Type</Text>
        <TextInput style={styles.input} value={editor.type} onChangeText={(value) => setEditor((current) => ({ ...current, type: value }))} />
        <Text style={styles.label}>Status</Text>
        <TextInput style={styles.input} value={editor.status} onChangeText={(value) => setEditor((current) => ({ ...current, status: value }))} />
        <Text style={styles.label}>Due date</Text>
        <TextInput style={styles.input} value={editor.dueDate} onChangeText={(value) => setEditor((current) => ({ ...current, dueDate: value }))} />
        <Text style={styles.label}>Spend window start</Text>
        <TextInput style={styles.input} value={editor.spendWindowStart} onChangeText={(value) => setEditor((current) => ({ ...current, spendWindowStart: value }))} />
        <Text style={styles.label}>Spend window end</Text>
        <TextInput style={styles.input} value={editor.spendWindowEnd} onChangeText={(value) => setEditor((current) => ({ ...current, spendWindowEnd: value }))} />
        <Text style={styles.label}>Planned amount</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={editor.plannedAmount} onChangeText={(value) => setEditor((current) => ({ ...current, plannedAmount: value }))} />
        <Text style={styles.label}>Funded amount</Text>
        <TextInput style={styles.input} keyboardType="decimal-pad" value={editor.fundedAmount} onChangeText={(value) => setEditor((current) => ({ ...current, fundedAmount: value }))} />
        <Text style={styles.label}>Tags</Text>
        <TextInput style={styles.input} value={editor.tagsText} onChangeText={(value) => setEditor((current) => ({ ...current, tagsText: value }))} placeholder="holiday, sinking-fund" placeholderTextColor={colors.muted} />
        <Text style={styles.label}>Notes</Text>
        <TextInput style={styles.notes} multiline value={editor.notes} onChangeText={(value) => setEditor((current) => ({ ...current, notes: value }))} />
        <Pressable style={styles.primaryButton} onPress={save} disabled={isSaving}>
          <Text style={styles.primaryButtonText}>{isSaving ? 'Creating...' : 'Create event'}</Text>
        </Pressable>
      </SurfaceCard>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFCF4', color: colors.text, fontSize: 15 },
  notes: { minHeight: 96, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#FFFCF4', color: colors.text, fontSize: 15, textAlignVertical: 'top' },
  primaryButton: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, backgroundColor: colors.forest, alignSelf: 'flex-start' },
  primaryButtonText: { color: '#FFF8EA', fontWeight: '700' },
});