import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { theme } from '../theme';

type BillStatusBadgeProps = {
  statusCode?: string | null;
};

const leafSvg = `
<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M51.076 36.7895L42.1598 41.3684L43.6997 44.4211L37.5399 43.2763V49H34.4601V43.2763L28.3003 44.4211L29.8402 41.3684L20.924 36.7895L22.4639 34.1489L20 29.1579L25.5438 28.8068L27.0837 26.1053L32.3503 32.0579L29.8402 24.5789H32.9201L36 20L39.0799 24.5789H42.1598L39.6497 32.0579L44.9163 26.1053L46.4562 28.7458L52 29.0968L49.5361 34.0268L51.076 36.7895Z" fill="#1C24C3"/>
</svg>
`;

const pageSvg = (color: string, number?: string) => `
<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 14C22 11.7909 23.7909 10 26 10H40L52 22V58C52 60.2091 50.2091 62 48 62H26C23.7909 62 22 60.2091 22 58V14Z" fill="none" stroke="${color}" stroke-width="6"/>
  <path d="M40 10V22H52" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  ${number ? `<text x="36" y="45" text-anchor="middle" font-size="24" font-weight="700" fill="${color}" font-family="System"> ${number}</text>` : ''}
</svg>
`;

const timerSvg = (color: string) => `
<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="36" cy="40" r="16" stroke="${color}" stroke-width="6"/>
  <rect x="30" y="14" width="12" height="6" rx="3" fill="${color}"/>
  <line x1="36" y1="40" x2="36" y2="30" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
  <line x1="36" y1="40" x2="44" y2="44" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
</svg>
`;

const groupSvg = (color: string) => `
<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="26" cy="32" r="8" fill="${color}"/>
  <circle cx="46" cy="32" r="8" fill="${color}"/>
  <rect x="16" y="42" width="20" height="12" rx="6" fill="${color}"/>
  <rect x="36" y="42" width="20" height="12" rx="6" fill="${color}"/>
</svg>
`;

const clipboardSvg = (color: string) => `
<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="22" y="18" width="28" height="36" rx="4" stroke="${color}" stroke-width="6"/>
  <rect x="28" y="12" width="16" height="8" rx="4" fill="${color}"/>
  <line x1="28" y1="30" x2="44" y2="30" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
  <line x1="28" y1="40" x2="42" y2="40" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
</svg>
`;

const withdrawnSvg = `
<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="36" cy="36" r="20" fill="#ffffff" stroke="#990100" stroke-width="8"/>
  <line x1="22" y1="22" x2="50" y2="50" stroke="#990100" stroke-width="8" stroke-linecap="round"/>
</svg>
`;

const normalize = (value: string) => value.trim().toLowerCase();

const getReadingNumber = (value: string) => {
  if (value.includes('1st')) return '1st';
  if (value.includes('2nd')) return '2nd';
  if (value.includes('3rd')) return '3rd';
  const match = value.match(/at(\d)(st|nd|rd)reading/);
  if (match) {
    const [digit, suffix] = match.slice(1);
    return `${digit}${suffix}`;
  }
  return null;
};

const getStatusConfig = (statusCode: string) => {
  const normalized = normalize(statusCode);

  if (normalized === 'royalassentgiven') {
    return { icon: leafSvg, label: 'Royal Assent' };
  }

  if (
    normalized === 'billdefeated' ||
    normalized === 'willnotbeproceededwith'
  ) {
    return { icon: withdrawnSvg, label: 'Withdrawn from Parliament' };
  }

  if (normalized === 'outsideorderprecedence') {
    return {
      icon: timerSvg(theme.colors.textMuted),
      label: 'Outside Order of Precedence',
    };
  }

  if (normalized === 'senateatreportstage') {
    return { icon: clipboardSvg('#990100'), label: 'Report Stage (Senate)' };
  }

  if (normalized === 'houseatreportstage') {
    return { icon: clipboardSvg('#007411'), label: 'Report Stage (House)' };
  }

  if (normalized === 'senateincommittee') {
    return { icon: groupSvg('#990100'), label: 'In Committee (Senate)' };
  }

  if (normalized === 'houseincommittee') {
    return { icon: groupSvg('#007411'), label: 'In Committee (House)' };
  }

  if (normalized.startsWith('senateat') && normalized.includes('reading')) {
    const reading = getReadingNumber(normalized);
    return {
      icon: pageSvg('#007411', reading ? reading[0] : undefined),
      label: reading ? `${reading} Reading (Senate)` : 'Reading (Senate)',
    };
  }

  if (normalized.startsWith('houseat') && normalized.includes('reading')) {
    const reading = getReadingNumber(normalized);
    return {
      icon: pageSvg('#990100', reading ? reading[0] : undefined),
      label: reading ? `${reading} Reading (House)` : 'Reading (House)',
    };
  }

  return { icon: pageSvg(theme.colors.textMuted), label: statusCode };
};

const BillStatusBadge: React.FC<BillStatusBadgeProps> = ({ statusCode }) => {
  if (!statusCode) return null;
  const { icon, label } = getStatusConfig(statusCode);

  return (
    <View style={styles.container}>
      <SvgXml xml={icon} width={22} height={22} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
});

export default BillStatusBadge;
