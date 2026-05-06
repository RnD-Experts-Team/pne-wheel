export type WheelThemeKey =
    | 'dark'
    | 'casino'
    | 'pastel'
    | 'neon'
    | 'royal'
    | 'gold'
    | 'ocean'
    | 'sunset'
    | 'midnight'
    | 'retro'
    | 'brand'
    | 'custom';

export type CustomPalette = {
    accent?: string;
    rim?: string;
    pointer?: string;
    textColor?: string;
    background?: string;
    surface?: string;
    sliceColors?: string[];
};

export type WheelTheme = {
    key: WheelThemeKey;
    label: string;
    labelAr: string;
    background: string;
    surface: string;
    panel: string;
    text: string;
    mutedText: string;
    accent: string;
    pointer: string;
    rim: string;
    rimHighlight: string;
    pegOn: string;
    pegOff: string;
    sliceColors: string[];
    sliceTextColor: string;
};

export const WHEEL_THEMES: Record<WheelThemeKey, WheelTheme> = {
    dark: {
        key: 'dark',
        label: 'Dark',
        labelAr: 'داكن',
        background: '#0a0a0b',
        surface: '#111114',
        panel: 'rgba(255,255,255,0.04)',
        text: '#fafafa',
        mutedText: '#9ca3af',
        accent: '#f5f5f5',
        pointer: '#fafafa',
        rim: '#3f3f46',
        rimHighlight: '#fafafa',
        pegOn: '#fef08a',
        pegOff: '#1f1f24',
        sliceColors: ['#1f1f22', '#0c0c0e', '#2a2a2e', '#141417'],
        sliceTextColor: '#f5f5f5',
    },
    casino: {
        key: 'casino',
        label: 'Casino',
        labelAr: 'كازينو',
        background: '#0b1d12',
        surface: '#0d2316',
        panel: 'rgba(220, 199, 121, 0.08)',
        text: '#fef9c3',
        mutedText: '#bfa76a',
        accent: '#facc15',
        pointer: '#facc15',
        rim: '#854d0e',
        rimHighlight: '#fde047',
        pegOn: '#fde047',
        pegOff: '#3f2c08',
        sliceColors: ['#b91c1c', '#0a0a0a', '#15803d', '#0a0a0a'],
        sliceTextColor: '#fef9c3',
    },
    pastel: {
        key: 'pastel',
        label: 'Pastel',
        labelAr: 'باستيل',
        background: '#fdf2f8',
        surface: '#fff7fb',
        panel: 'rgba(190, 24, 93, 0.05)',
        text: '#1f2937',
        mutedText: '#6b7280',
        accent: '#ec4899',
        pointer: '#ec4899',
        rim: '#fbcfe8',
        rimHighlight: '#fff',
        pegOn: '#fbbf24',
        pegOff: '#fce7f3',
        sliceColors: ['#fbcfe8', '#bae6fd', '#bbf7d0', '#fde68a', '#ddd6fe', '#fecaca'],
        sliceTextColor: '#1f2937',
    },
    neon: {
        key: 'neon',
        label: 'Neon',
        labelAr: 'نيون',
        background: '#05060f',
        surface: '#0b0d1f',
        panel: 'rgba(124, 58, 237, 0.12)',
        text: '#f5f3ff',
        mutedText: '#a78bfa',
        accent: '#22d3ee',
        pointer: '#f0abfc',
        rim: '#7c3aed',
        rimHighlight: '#f0abfc',
        pegOn: '#f0abfc',
        pegOff: '#1e1b4b',
        sliceColors: ['#7c3aed', '#0b0d1f', '#22d3ee', '#0b0d1f', '#f0abfc', '#0b0d1f'],
        sliceTextColor: '#f5f3ff',
    },
    royal: {
        key: 'royal',
        label: 'Royal blue',
        labelAr: 'ملكي أزرق',
        background: '#d7e8f4',
        surface: '#f4f8fc',
        panel: 'rgba(190, 145, 76, 0.18)',
        text: '#173a5d',
        mutedText: '#476782',
        accent: '#caa45b',
        pointer: '#d8b16a',
        rim: '#9f7a3f',
        rimHighlight: '#f0dbaf',
        pegOn: '#f6e08b',
        pegOff: '#3a5570',
        sliceColors: ['#1e5f98', '#e7f0f8', '#1f6aab', '#f1f6fb', '#225d8e'],
        sliceTextColor: '#f8fbff',
    },
    gold: {
        key: 'gold',
        label: 'Gold & ruby',
        labelAr: 'ذهب وياقوت',
        background: '#1a0606',
        surface: '#260909',
        panel: 'rgba(250, 204, 21, 0.1)',
        text: '#fef9c3',
        mutedText: '#facc15',
        accent: '#facc15',
        pointer: '#facc15',
        rim: '#92400e',
        rimHighlight: '#fde68a',
        pegOn: '#fde047',
        pegOff: '#3f1d09',
        sliceColors: ['#7f1d1d', '#facc15', '#7f1d1d', '#fef3c7'],
        sliceTextColor: '#1a0606',
    },
    ocean: {
        key: 'ocean',
        label: 'Ocean',
        labelAr: 'محيط',
        background: '#020617',
        surface: '#082f49',
        panel: 'rgba(125, 211, 252, 0.1)',
        text: '#e0f2fe',
        mutedText: '#7dd3fc',
        accent: '#22d3ee',
        pointer: '#22d3ee',
        rim: '#155e75',
        rimHighlight: '#67e8f9',
        pegOn: '#67e8f9',
        pegOff: '#0c4a6e',
        sliceColors: ['#0e7490', '#082f49', '#0891b2', '#082f49', '#06b6d4'],
        sliceTextColor: '#e0f2fe',
    },
    sunset: {
        key: 'sunset',
        label: 'Sunset',
        labelAr: 'غروب',
        background: '#1c0a14',
        surface: '#2a0e1c',
        panel: 'rgba(251, 113, 133, 0.12)',
        text: '#ffe4e6',
        mutedText: '#fda4af',
        accent: '#fb923c',
        pointer: '#fb923c',
        rim: '#9a3412',
        rimHighlight: '#fdba74',
        pegOn: '#fde047',
        pegOff: '#3f1419',
        sliceColors: ['#ea580c', '#be123c', '#fb923c', '#9d174d'],
        sliceTextColor: '#fff7ed',
    },
    midnight: {
        key: 'midnight',
        label: 'Midnight',
        labelAr: 'منتصف الليل',
        background: '#020617',
        surface: '#0f172a',
        panel: 'rgba(99, 102, 241, 0.1)',
        text: '#e2e8f0',
        mutedText: '#94a3b8',
        accent: '#6366f1',
        pointer: '#818cf8',
        rim: '#1e293b',
        rimHighlight: '#a5b4fc',
        pegOn: '#a5b4fc',
        pegOff: '#0f172a',
        sliceColors: ['#1e293b', '#0f172a', '#312e81', '#0f172a'],
        sliceTextColor: '#e2e8f0',
    },
    retro: {
        key: 'retro',
        label: 'Retro 70s',
        labelAr: 'ريترو السبعينات',
        background: '#1f140a',
        surface: '#2d1d10',
        panel: 'rgba(251, 191, 36, 0.12)',
        text: '#fef3c7',
        mutedText: '#fcd34d',
        accent: '#f59e0b',
        pointer: '#f59e0b',
        rim: '#78350f',
        rimHighlight: '#fcd34d',
        pegOn: '#fde047',
        pegOff: '#451a03',
        sliceColors: ['#a16207', '#92400e', '#ca8a04', '#7c2d12', '#b45309'],
        sliceTextColor: '#fef3c7',
    },
    brand: {
        key: 'brand',
        label: 'Brand color',
        labelAr: 'لون العلامة',
        background: '#0a0a0b',
        surface: '#111114',
        panel: 'rgba(255,255,255,0.04)',
        text: '#fafafa',
        mutedText: '#9ca3af',
        accent: '#3b82f6',
        pointer: '#3b82f6',
        rim: '#1e40af',
        rimHighlight: '#93c5fd',
        pegOn: '#fef08a',
        pegOff: '#1f1f24',
        sliceColors: ['#1e3a8a', '#0a0a0a', '#3b82f6', '#0a0a0a'],
        sliceTextColor: '#f5f5f5',
    },
    custom: {
        // Used as a base when theme === 'custom'. The merchant's custom_palette
        // is merged on top — only set the fields the user overrides.
        key: 'custom',
        label: 'Custom palette',
        labelAr: 'لوحة مخصصة',
        background: '#0a0a0b',
        surface: '#111114',
        panel: 'rgba(255,255,255,0.06)',
        text: '#fafafa',
        mutedText: '#9ca3af',
        accent: '#22d3ee',
        pointer: '#22d3ee',
        rim: '#1e293b',
        rimHighlight: '#67e8f9',
        pegOn: '#67e8f9',
        pegOff: '#0f172a',
        sliceColors: ['#0e7490', '#0f172a', '#06b6d4', '#0f172a'],
        sliceTextColor: '#fafafa',
    },
};

const hexToRgb = (hex: string): [number, number, number] | null => {
    const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
    if (!m) return null;
    const v = parseInt(m[1], 16);
    return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
};

const rgbToHex = (r: number, g: number, b: number): string =>
    '#' +
    [r, g, b]
        .map((c) =>
            Math.max(0, Math.min(255, Math.round(c)))
                .toString(16)
                .padStart(2, '0'),
        )
        .join('');

const mix = (hex: string, withHex: string, ratio: number): string => {
    const a = hexToRgb(hex);
    const b = hexToRgb(withHex);
    if (!a || !b) return hex;
    return rgbToHex(
        a[0] * (1 - ratio) + b[0] * ratio,
        a[1] * (1 - ratio) + b[1] * ratio,
        a[2] * (1 - ratio) + b[2] * ratio,
    );
};

/**
 * Resolve a theme into a concrete WheelTheme.
 *
 * - `brand` theme: derive a harmonised palette from a single brand color.
 * - `custom` theme: layer the user-defined `customPalette` on top of the base.
 * - other themes: returned as-is.
 */
export const resolveTheme = (
    themeKey: WheelThemeKey,
    brandColor: string | null,
    customPalette: CustomPalette | null = null,
): WheelTheme => {
    const base = WHEEL_THEMES[themeKey] ?? WHEEL_THEMES.dark;

    if (themeKey === 'brand' && brandColor) {
        const accent = brandColor;
        return {
            ...base,
            accent,
            pointer: accent,
            rim: mix(accent, '#000000', 0.55),
            rimHighlight: mix(accent, '#ffffff', 0.45),
            sliceColors: [
                mix(accent, '#000000', 0.7),
                '#0a0a0a',
                accent,
                mix(accent, '#000000', 0.4),
            ],
        };
    }

    if (themeKey === 'custom' && customPalette) {
        const sliceColors =
            customPalette.sliceColors && customPalette.sliceColors.length >= 2
                ? customPalette.sliceColors
                : base.sliceColors;
        const accent = customPalette.accent ?? base.accent;
        const rim = customPalette.rim ?? base.rim;
        return {
            ...base,
            background: customPalette.background ?? base.background,
            surface: customPalette.surface ?? base.surface,
            text: customPalette.textColor ?? base.text,
            accent,
            pointer: customPalette.pointer ?? accent,
            rim,
            rimHighlight: mix(rim, '#ffffff', 0.45),
            pegOn: customPalette.accent ?? base.pegOn,
            sliceColors,
            sliceTextColor: customPalette.textColor ?? base.sliceTextColor,
        };
    }

    return base;
};
