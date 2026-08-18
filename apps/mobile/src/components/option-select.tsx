// RF-SMART Elevate owns this file
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { colors } from '../lib/theme';

export type OptionSelectItem = {
  label: string;
  value: string;
};

type OptionSelectProps = {
  label: string;
  value: string;
  options: Array<string | OptionSelectItem>;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function OptionSelect({ label, value, options, onChange, placeholder = 'Select an option', disabled = false }: OptionSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedOptions = options.map((option) => typeof option === 'string'
    ? { label: option, value: option }
    : option);
  const selectedOption = normalizedOptions.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.trigger, disabled ? styles.triggerDisabled : null]} onPress={() => !disabled && setIsOpen(true)}>
        <Text style={selectedOption ? styles.valueText : styles.placeholderText}>{selectedOption?.label ?? placeholder}</Text>
        <Text style={[styles.chevron, disabled ? styles.chevronDisabled : null]}>{disabled ? 'locked' : 'v'}</Text>
      </Pressable>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <ScrollView contentContainerStyle={styles.optionList}>
              {normalizedOptions.map((option) => (
                <Pressable
                  key={`${option.value}-${option.label}`}
                  style={[styles.optionRow, option.value === value ? styles.optionRowActive : null]}
                  onPress={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, option.value === value ? styles.optionTextActive : null]}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
  trigger: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFCF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  triggerDisabled: {
    backgroundColor: '#F3EEE2',
  },
  valueText: {
    color: colors.text,
    fontSize: 15,
    flex: 1,
  },
  placeholderText: {
    color: colors.muted,
    fontSize: 15,
    flex: 1,
  },
  chevron: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  chevronDisabled: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 52, 43, 0.42)',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    maxHeight: '72%',
    borderRadius: 24,
    backgroundColor: colors.creamSoft,
    padding: 20,
    gap: 16,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  optionList: {
    gap: 10,
  },
  optionRow: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFCF4',
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionRowActive: {
    backgroundColor: '#E5F0EA',
    borderColor: colors.forestSoft,
  },
  optionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextActive: {
    color: colors.forest,
  },
});