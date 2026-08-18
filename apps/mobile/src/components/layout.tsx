// RF-SMART Elevate owns this file
import { Link } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../lib/theme';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>{children}</ScrollView>
    </SafeAreaView>
  );
}

export function Hero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.kicker}>Zero Sum Finance</Text>
      <Text style={styles.heroTitle}>{title}</Text>
      <Text style={styles.heroSubtitle}>{subtitle}</Text>
      <View style={styles.navRow}>
        <NavLink href="/" label="Dashboard" />
        <NavLink href="/inbox" label="Inbox" />
        <NavLink href="/events" label="Events" />
        <NavLink href="/audit" label="Audit" />
      </View>
    </View>
  );
}

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function SurfaceCard({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function SummaryTile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function NavLink({ href, label }: { href: '/' | '/audit' | '/inbox' | '/events'; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.navLink}>
        <Text style={styles.navLinkText}>{label}</Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.forest,
  },
  container: {
    paddingBottom: 48,
    backgroundColor: colors.cream,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    backgroundColor: colors.forest,
  },
  kicker: {
    color: colors.gold,
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
    marginBottom: 18,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
  },
  navLink: {
    backgroundColor: colors.forestSoft,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  navLinkText: {
    color: '#FFF8EA',
    fontWeight: '700',
    fontSize: 13,
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
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  card: {
    marginHorizontal: 24,
    borderRadius: 22,
    backgroundColor: colors.creamSoft,
    padding: 18,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTile: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.forestSoft,
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
});
