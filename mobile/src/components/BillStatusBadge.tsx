import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { theme } from '../theme';

type BillStatusBadgeProps = {
  statusCode?: string | null;
  showLabel?: boolean;
  showPhaseTag?: boolean;
  enableTooltip?: boolean;
  size?: number;
  labelStyle?: object;
  containerStyle?: object;
};

const STAGE_COLORS = {
  final: theme.colors.success,
  withdrawn: theme.colors.accentDark,
  reading: '#1f5fbf',
  committee: '#5b3db2',
  report: '#a16207',
  pending: theme.colors.textMuted,
};

const CHAMBER_COLORS = {
  senate: '#990100',
  house: '#007411',
};

const leafSvg = (color: string) => `
<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M51.076 36.7895L42.1598 41.3684L43.6997 44.4211L37.5399 43.2763V49H34.4601V43.2763L28.3003 44.4211L29.8402 41.3684L20.924 36.7895L22.4639 34.1489L20 29.1579L25.5438 28.8068L27.0837 26.1053L32.3503 32.0579L29.8402 24.5789H32.9201L36 20L39.0799 24.5789H42.1598L39.6497 32.0579L44.9163 26.1053L46.4562 28.7458L52 29.0968L49.5361 34.0268L51.076 36.7895Z" fill="${color}"/>
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

const withdrawnSvg = (color: string) => `
<svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="36" cy="36" r="20" fill="#ffffff" stroke="${color}" stroke-width="8"/>
  <line x1="22" y1="22" x2="50" y2="50" stroke="${color}" stroke-width="8" stroke-linecap="round"/>
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

export type StatusConfig = {
  icon: string;
  label: string;
  phaseLabel: string;
  description: string;
  color: string;
  scale?: number;
};

const getChamberColor = (normalizedStatus: string): string | null => {
  if (normalizedStatus.includes('senate')) return CHAMBER_COLORS.senate;
  if (normalizedStatus.includes('house')) return CHAMBER_COLORS.house;
  return null;
};

export const getStatusConfig = (statusCode: string): StatusConfig => {
  const normalized = normalize(statusCode);
  const chamberColor = getChamberColor(normalized);

  if (normalized === 'royalassentgiven') {
    return {
      icon: leafSvg(STAGE_COLORS.final),
      label: 'Royal Assent',
      phaseLabel: 'Assented',
      description: 'This bill has completed the legislative process.',
      color: STAGE_COLORS.final,
      scale: 1.25,
    };
  }

  if (
    normalized === 'billdefeated' ||
    normalized === 'willnotbeproceededwith'
  ) {
    return {
      icon: withdrawnSvg(STAGE_COLORS.withdrawn),
      label: 'Withdrawn from Parliament',
      phaseLabel: 'Stopped',
      description: 'This bill is no longer moving forward.',
      color: STAGE_COLORS.withdrawn,
    };
  }

  if (normalized === 'outsideorderprecedence') {
    return {
      icon: timerSvg(STAGE_COLORS.pending),
      label: 'Outside Order of Precedence',
      phaseLabel: 'Hold',
      description: 'This bill is not currently prioritized for debate.',
      color: STAGE_COLORS.pending,
    };
  }

  if (normalized === 'senateatreportstage') {
    const color = chamberColor ?? STAGE_COLORS.report;
    return {
      icon: clipboardSvg(color),
      label: 'Report Stage (Senate)',
      phaseLabel: 'Report',
      description: 'Committee findings are being reported back to the chamber.',
      color,
    };
  }

  if (normalized === 'houseatreportstage') {
    const color = chamberColor ?? STAGE_COLORS.report;
    return {
      icon: clipboardSvg(color),
      label: 'Report Stage (House)',
      phaseLabel: 'Report',
      description: 'Committee findings are being reported back to the chamber.',
      color,
    };
  }

  if (normalized === 'senateincommittee') {
    const color = chamberColor ?? STAGE_COLORS.committee;
    return {
      icon: groupSvg(color),
      label: 'In Committee (Senate)',
      phaseLabel: 'Committee',
      description: 'A committee is reviewing and potentially amending this bill.',
      color,
    };
  }

  if (normalized === 'houseincommittee') {
    const color = chamberColor ?? STAGE_COLORS.committee;
    return {
      icon: groupSvg(color),
      label: 'In Committee (House)',
      phaseLabel: 'Committee',
      description: 'A committee is reviewing and potentially amending this bill.',
      color,
    };
  }

  if (normalized.startsWith('senateat') && normalized.includes('reading')) {
    const reading = getReadingNumber(normalized);
    const color = chamberColor ?? STAGE_COLORS.reading;
    return {
      icon: pageSvg(color, reading ? reading[0] : undefined),
      label: reading ? `${reading} Reading (Senate)` : 'Reading (Senate)',
      phaseLabel: 'Reading',
      description: 'This bill is currently in one of the chamber reading stages.',
      color,
    };
  }

  if (normalized.startsWith('houseat') && normalized.includes('reading')) {
    const reading = getReadingNumber(normalized);
    const color = chamberColor ?? STAGE_COLORS.reading;
    return {
      icon: pageSvg(color, reading ? reading[0] : undefined),
      label: reading ? `${reading} Reading (House)` : 'Reading (House)',
      phaseLabel: 'Reading',
      description: 'This bill is currently in one of the chamber reading stages.',
      color,
    };
  }

  return {
    icon: pageSvg(theme.colors.textMuted),
    label: statusCode,
    phaseLabel: 'Status',
    description: 'Current stage reported by Parliament.',
    color: theme.colors.textMuted,
  };
};

const BillStatusBadge: React.FC<BillStatusBadgeProps> = ({
  statusCode,
  showLabel = true,
  showPhaseTag = false,
  enableTooltip = false,
  size = 22,
  labelStyle,
  containerStyle,
}) => {
  if (!statusCode) return null;
  const { icon, label, phaseLabel, description, color, scale = 1 } = getStatusConfig(statusCode);
  const iconSize = Math.round(size * scale);

  const handleLongPress = () => {
    if (!enableTooltip) return;
    Alert.alert('Bill Stage', `${label}\n\n${description}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={handleLongPress}
      delayLongPress={300}
      disabled={!enableTooltip}
      accessibilityRole="button"
      accessibilityLabel={`Bill stage: ${label}`}
      accessibilityHint={enableTooltip ? 'Long press to learn what this stage means.' : undefined}
    >
      <View style={[styles.container, containerStyle]}>
        <SvgXml xml={icon} width={iconSize} height={iconSize} />
        {showPhaseTag ? (
          <View style={[styles.phaseTag, { borderColor: color }]}>
            <Text style={[styles.phaseTagText, { color }]}>{phaseLabel}</Text>
          </View>
        ) : null}
        {showLabel ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
      </View>
    </TouchableOpacity>
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
  phaseTag: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  phaseTagText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default BillStatusBadge;
