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

export const THEMES = {
  'warm-coal': {
    name: 'Warm Coal',
    swatches: ['oklch(0.18 0.008 60)', 'oklch(0.235 0.01 60)', 'oklch(0.36 0.014 60)'],
  },
  'midnight': {
    name: 'Midnight',
    swatches: ['oklch(0.155 0.014 250)', 'oklch(0.21 0.016 250)', 'oklch(0.34 0.02 250)'],
  },
  'deep-forest': {
    name: 'Deep Forest',
    swatches: ['oklch(0.155 0.016 155)', 'oklch(0.21 0.019 155)', 'oklch(0.34 0.025 155)'],
  },
  'obsidian': {
    name: 'Obsidian',
    swatches: ['oklch(0.14 0.01 285)', 'oklch(0.195 0.014 285)', 'oklch(0.33 0.018 285)'],
  },
} as const;

export type ThemeKey = keyof typeof THEMES;

type ThemeVars = Record<string, string>;

const THEME_VARS: Record<ThemeKey, ThemeVars> = {
  'warm-coal': {
    // backgrounds
    '--bg':            'oklch(0.18 0.008 60)',
    '--bg-2':          'oklch(0.21 0.009 60)',
    '--surface':       'oklch(0.235 0.01 60)',
    '--surface-2':     'oklch(0.27 0.011 60)',
    '--border':        'oklch(0.30 0.012 60)',
    '--border-strong': 'oklch(0.36 0.014 60)',
    // text
    '--text':          'oklch(0.96 0.005 80)',
    '--text-dim':      'oklch(0.74 0.008 70)',
    '--text-mute':     'oklch(0.56 0.01 70)',
    // enterprise tier — gold
    '--tier-ent':      'oklch(0.82 0.17 70)',
    '--tier-ent-soft': 'oklch(0.82 0.17 70 / 0.15)',
    // semantic
    '--danger':        'oklch(0.70 0.19 22)',
    '--danger-soft':   'oklch(0.70 0.19 22 / 0.14)',
    '--warn':          'oklch(0.80 0.16 75)',
    '--warn-soft':     'oklch(0.80 0.16 75 / 0.14)',
    '--info':          'oklch(0.78 0.13 200)',
    '--info-soft':     'oklch(0.78 0.13 200 / 0.14)',
    '--violet':        'oklch(0.72 0.15 290)',
    '--violet-soft':   'oklch(0.72 0.15 290 / 0.14)',
  },
  'midnight': {
    // backgrounds — cool blue-gray
    '--bg':            'oklch(0.155 0.014 250)',
    '--bg-2':          'oklch(0.185 0.015 250)',
    '--surface':       'oklch(0.21 0.016 250)',
    '--surface-2':     'oklch(0.245 0.017 250)',
    '--border':        'oklch(0.28 0.018 250)',
    '--border-strong': 'oklch(0.34 0.02 250)',
    // text
    '--text':          'oklch(0.95 0.005 220)',
    '--text-dim':      'oklch(0.72 0.01 220)',
    '--text-mute':     'oklch(0.54 0.012 220)',
    // enterprise tier — cyan pops against blue bg
    '--tier-ent':      'oklch(0.80 0.14 185)',
    '--tier-ent-soft': 'oklch(0.80 0.14 185 / 0.15)',
    // semantic — warm accents contrast against cool bg
    '--danger':        'oklch(0.72 0.19 15)',
    '--danger-soft':   'oklch(0.72 0.19 15 / 0.14)',
    '--warn':          'oklch(0.82 0.16 70)',
    '--warn-soft':     'oklch(0.82 0.16 70 / 0.14)',
    '--info':          'oklch(0.80 0.13 210)',
    '--info-soft':     'oklch(0.80 0.13 210 / 0.14)',
    '--violet':        'oklch(0.74 0.16 300)',
    '--violet-soft':   'oklch(0.74 0.16 300 / 0.14)',
  },
  'deep-forest': {
    // backgrounds — dark green
    '--bg':            'oklch(0.155 0.016 155)',
    '--bg-2':          'oklch(0.185 0.018 155)',
    '--surface':       'oklch(0.21 0.019 155)',
    '--surface-2':     'oklch(0.245 0.02 155)',
    '--border':        'oklch(0.28 0.022 155)',
    '--border-strong': 'oklch(0.34 0.025 155)',
    // text — slight green tint
    '--text':          'oklch(0.95 0.006 145)',
    '--text-dim':      'oklch(0.72 0.011 145)',
    '--text-mute':     'oklch(0.54 0.013 145)',
    // enterprise tier — lime green matches the theme energy
    '--tier-ent':      'oklch(0.83 0.18 140)',
    '--tier-ent-soft': 'oklch(0.83 0.18 140 / 0.15)',
    // semantic — yellow warn stands out from green
    '--danger':        'oklch(0.71 0.20 18)',
    '--danger-soft':   'oklch(0.71 0.20 18 / 0.14)',
    '--warn':          'oklch(0.82 0.16 82)',
    '--warn-soft':     'oklch(0.82 0.16 82 / 0.14)',
    '--info':          'oklch(0.78 0.13 215)',
    '--info-soft':     'oklch(0.78 0.13 215 / 0.14)',
    '--violet':        'oklch(0.73 0.16 295)',
    '--violet-soft':   'oklch(0.73 0.16 295 / 0.14)',
  },
  'obsidian': {
    // backgrounds — near-black violet
    '--bg':            'oklch(0.14 0.01 285)',
    '--bg-2':          'oklch(0.17 0.012 285)',
    '--surface':       'oklch(0.195 0.014 285)',
    '--surface-2':     'oklch(0.23 0.015 285)',
    '--border':        'oklch(0.27 0.016 285)',
    '--border-strong': 'oklch(0.33 0.018 285)',
    // text — slight violet tint
    '--text':          'oklch(0.95 0.005 290)',
    '--text-dim':      'oklch(0.72 0.01 285)',
    '--text-mute':     'oklch(0.54 0.012 285)',
    // enterprise tier — vivid violet/lavender
    '--tier-ent':      'oklch(0.80 0.18 285)',
    '--tier-ent-soft': 'oklch(0.80 0.18 285 / 0.15)',
    // semantic
    '--danger':        'oklch(0.70 0.20 22)',
    '--danger-soft':   'oklch(0.70 0.20 22 / 0.14)',
    '--warn':          'oklch(0.80 0.15 75)',
    '--warn-soft':     'oklch(0.80 0.15 75 / 0.14)',
    '--info':          'oklch(0.78 0.13 210)',
    '--info-soft':     'oklch(0.78 0.13 210 / 0.14)',
    '--violet':        'oklch(0.76 0.18 285)',
    '--violet-soft':   'oklch(0.76 0.18 285 / 0.14)',
  },
};

export const makeCssVars = (
  { accentHue = 145, theme = 'warm-coal' as ThemeKey }: { accentHue?: number; theme?: ThemeKey } = {}
): Record<string, string> => ({
  ...THEME_VARS[theme],
  '--accent':      `oklch(0.82 0.19 ${accentHue})`,
  '--accent-ink':  `oklch(0.22 0.05 ${accentHue})`,
  '--accent-soft': `oklch(0.82 0.19 ${accentHue} / 0.14)`,
});
