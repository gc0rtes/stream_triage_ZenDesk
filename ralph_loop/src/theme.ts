export const ACCENT_PRESETS = {
  green:  { hue: 145, name: 'Electric green' },
  amber:  { hue: 70,  name: 'Amber' },
  cyan:   { hue: 200, name: 'Cyan' },
  violet: { hue: 295, name: 'Violet' },
  coral:  { hue: 25,  name: 'Coral' },
} as const;

export const DENSITY_PRESETS = {
  compact:     { rowGap: 6,  cardPad: 10, cardFont: 12.5, headerPad: 10 },
  comfortable: { rowGap: 10, cardPad: 14, cardFont: 13.5, headerPad: 14 },
  roomy:       { rowGap: 14, cardPad: 18, cardFont: 14,   headerPad: 18 },
} as const;

export const makeCssVars = ({ accentHue = 145 }: { accentHue?: number } = {}): Record<string, string> => ({
  '--bg':            'oklch(0.18 0.008 60)',
  '--bg-2':          'oklch(0.21 0.009 60)',
  '--surface':       'oklch(0.235 0.01 60)',
  '--surface-2':     'oklch(0.27 0.011 60)',
  '--border':        'oklch(0.30 0.012 60)',
  '--border-strong': 'oklch(0.36 0.014 60)',
  '--text':          'oklch(0.96 0.005 80)',
  '--text-dim':      'oklch(0.74 0.008 70)',
  '--text-mute':     'oklch(0.56 0.01 70)',
  '--accent':        `oklch(0.82 0.19 ${accentHue})`,
  '--accent-ink':    `oklch(0.22 0.05 ${accentHue})`,
  '--accent-soft':   `oklch(0.82 0.19 ${accentHue} / 0.14)`,
  '--danger':        'oklch(0.70 0.19 25)',
  '--danger-soft':   'oklch(0.70 0.19 25 / 0.14)',
  '--warn':          'oklch(0.80 0.16 75)',
  '--warn-soft':     'oklch(0.80 0.16 75 / 0.14)',
  '--info':          'oklch(0.78 0.12 220)',
  '--info-soft':     'oklch(0.78 0.12 220 / 0.14)',
  '--violet':        'oklch(0.72 0.15 295)',
  '--violet-soft':   'oklch(0.72 0.15 295 / 0.14)',
});
