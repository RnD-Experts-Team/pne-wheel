import { motion, useAnimationControls } from 'framer-motion';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { WheelTheme } from '@/lib/wheel-themes';

export type PrizeWheelItem = {
    id: string | number;
    label: string;
    image_url?: string | null;
};

export type HubStyle = 'classic' | 'minimal' | 'logo' | 'starburst';
export type PointerStyle = 'classic' | 'arrow' | 'flag' | 'triangle' | 'pin' | 'ball' | 'diamond';
export type PegStyle = 'dots' | 'lights' | 'none';

export type PrizeWheelProps = {
    items: PrizeWheelItem[];
    /**
     * Optional override for the number of rendered wedges. When omitted, the
     * wedge count is derived from `items.length`. When provided and larger
     * than the items array, the items are repeated to fill the wheel.
     */
    numberOfFields?: number | null;
    theme: WheelTheme;
    hubStyle?: HubStyle;
    pointerStyle?: PointerStyle;
    pegStyle?: PegStyle;
    /** When provided alongside hubStyle="logo", the brand logo is drawn in the hub. */
    brandLogoUrl?: string | null;
    /** Localised label strings — falls back to English. */
    labels?: {
        spin?: string;
        spinning?: string;
        spinAgain?: string;
        hubText?: string;
    };
    /** Disable spinning entirely (e.g. while server is unreachable). */
    disabled?: boolean;
    /** Mute sound effects. The wheel still plays them when this is false. */
    muted?: boolean;
    /** Async resolver that returns the winning index from the backend. */
    resolveWinner: () => Promise<{ index: number }>;
    /** Fired once the spin has fully settled. */
    onSpinComplete?: (winner: PrizeWheelItem) => void;
};

const TAU = Math.PI * 2;
const FULL_ROTATIONS = 6;
const SPIN_DURATION = 6.8; // seconds — slightly slower for a heavier feel
const SETTLE_OVERSHOOT_FRACTION = 0.12; // how far past the target we briefly travel

const polar = (cx: number, cy: number, r: number, angleRad: number) => ({
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
});

const wedgePath = (cx: number, cy: number, r: number, startRad: number, endRad: number): string => {
    const start = polar(cx, cy, r, startRad);
    const end = polar(cx, cy, r, endRad);
    const largeArc = endRad - startRad > Math.PI ? 1 : 0;
    return [
        `M ${cx} ${cy}`,
        `L ${start.x} ${start.y}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
        'Z',
    ].join(' ');
};

const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);

export default function PrizeWheel({
    items,
    numberOfFields,
    theme,
    hubStyle = 'classic',
    pointerStyle = 'classic',
    pegStyle = 'dots',
    brandLogoUrl = null,
    labels,
    disabled = false,
    muted = false,
    resolveWinner,
    onSpinComplete,
}: PrizeWheelProps) {
    const controls = useAnimationControls();
    const reactId = useId();
    const sliceGradId = useCallback((i: number) => `${reactId}-slice-${i}`, [reactId]);
    const rimGradId = `${reactId}-rim`;
    const innerHubId = `${reactId}-hub`;

    const slices = useMemo(() => {
        if (items.length === 0) return [] as PrizeWheelItem[];
        const count = Math.max(2, numberOfFields ?? items.length);
        return Array.from({ length: count }, (_, i) => items[i % items.length]);
    }, [items, numberOfFields]);

    const sliceCount = slices.length;
    const sliceAngleDeg = sliceCount > 0 ? 360 / sliceCount : 360;
    const sliceAngleRad = sliceCount > 0 ? TAU / sliceCount : TAU;

    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winner, setWinner] = useState<PrizeWheelItem | null>(null);
    const [hasSpunOnce, setHasSpunOnce] = useState(false);
    const lastTickedSliceRef = useRef<number | null>(null);
    const tickAudioRef = useRef<((volume?: number) => void) | null>(null);
    const fanfareAudioRef = useRef<((volume?: number) => void) | null>(null);

    // Lazily import the sound module so it never blocks the initial render and
    // so SSR never sees `window`.
    useEffect(() => {
        let cancelled = false;
        void import('@/lib/wheel-sound').then((m) => {
            if (!cancelled) {
                tickAudioRef.current = m.playTick;
                fanfareAudioRef.current = m.playFanfare;
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const SIZE = 720;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const radius = SIZE / 2 - 24;
    const labelRadius = radius * 0.62;
    const imageRadius = radius * 0.36;

    const wedges = useMemo(() => {
        return slices.map((item, i) => {
            const startRad = -Math.PI / 2 - sliceAngleRad / 2 + i * sliceAngleRad;
            const endRad = startRad + sliceAngleRad;
            const midRad = startRad + sliceAngleRad / 2;
            const labelPos = polar(cx, cy, labelRadius, midRad);
            const imagePos = polar(cx, cy, imageRadius, midRad);
            const labelAngleDeg = (midRad * 180) / Math.PI + 90;
            const fillIndex = i % theme.sliceColors.length;
            return {
                key: `${item.id}-${i}`,
                label: item.label,
                image: item.image_url ?? null,
                d: wedgePath(cx, cy, radius, startRad, endRad),
                fill: `url(#${sliceGradId(fillIndex)})`,
                labelPos,
                imagePos,
                labelAngleDeg,
                fillIndex,
            };
        });
    }, [slices, sliceAngleRad, cx, cy, radius, labelRadius, imageRadius, theme.sliceColors.length, sliceGradId]);

    // Pegs around the rim — one per wedge boundary plus interior decoration.
    const pegs = useMemo(() => {
        if (sliceCount === 0) return [] as { x: number; y: number; r: number; angleDeg: number }[];
        const pegRadius = radius - 6;
        return Array.from({ length: sliceCount }, (_, i) => {
            const angleRad = -Math.PI / 2 - sliceAngleRad / 2 + i * sliceAngleRad;
            const p = polar(cx, cy, pegRadius, angleRad);
            return { x: p.x, y: p.y, r: 6, angleDeg: (angleRad * 180) / Math.PI };
        });
    }, [sliceCount, sliceAngleRad, cx, cy, radius]);

    // Tick driver — runs alongside the framer animation, plays a tick whenever
    // a new wedge crosses the pointer.
    const driveTicks = useCallback(
        (start: number, end: number, durationMs: number) => {
            if (muted || sliceCount === 0) return;
            const startTime = performance.now();
            const totalDelta = end - start;
            lastTickedSliceRef.current = null;

            const step = () => {
                const now = performance.now();
                const elapsed = now - startTime;
                const t = Math.min(1, elapsed / durationMs);
                const eased = easeOutQuint(t);
                const current = start + totalDelta * eased;
                // Which slice is currently aligned with the pointer (-90deg / top).
                const normalized = ((current % 360) + 360) % 360;
                const sliceIndex = Math.floor(((360 - normalized) % 360) / sliceAngleDeg);
                if (sliceIndex !== lastTickedSliceRef.current) {
                    lastTickedSliceRef.current = sliceIndex;
                    // Fade tick volume as we slow.
                    const volume = 0.05 + 0.18 * (1 - eased);
                    tickAudioRef.current?.(volume);
                }
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        },
        [muted, sliceCount, sliceAngleDeg],
    );

    const handleSpin = useCallback(async () => {
        if (isSpinning || disabled || sliceCount === 0) return;
        setIsSpinning(true);
        setWinner(null);

        try {
            const { index } = await resolveWinner();
            const targetIndex = ((index % sliceCount) + sliceCount) % sliceCount;
            const jitter = (Math.random() - 0.5) * sliceAngleDeg * 0.3;
            const settle = -targetIndex * sliceAngleDeg + jitter;
            const next = rotation + FULL_ROTATIONS * 360 + (settle - (rotation % 360));

            driveTicks(rotation, next, SPIN_DURATION * 1000);

            // Real wheels overshoot the winning slice slightly and rock back.
            // Three-keyframe path: zoom past it, then settle in the last 12%.
            const overshoot = next + sliceAngleDeg * SETTLE_OVERSHOOT_FRACTION;
            await controls.start({
                rotate: [rotation, overshoot, next],
                transition: {
                    type: 'tween',
                    duration: SPIN_DURATION,
                    times: [0, 0.88, 1],
                    ease: [
                        [0.16, 0.84, 0.22, 1],
                        [0.34, 0, 0.64, 1],
                    ],
                },
            });

            setRotation(next);
            const won = slices[targetIndex];
            setWinner(won);
            setHasSpunOnce(true);
            if (!muted) fanfareAudioRef.current?.();
            onSpinComplete?.(won);
        } finally {
            setIsSpinning(false);
        }
    }, [
        isSpinning, disabled, sliceCount, resolveWinner, sliceAngleDeg, rotation,
        driveTicks, controls, slices, muted, onSpinComplete,
    ]);

    const buttonLabel = isSpinning
        ? (labels?.spinning ?? 'Spinning…')
        : hasSpunOnce
          ? (labels?.spinAgain ?? 'Spin again')
          : (labels?.spin ?? 'Tap to spin');

    return (
        <div className="flex w-full flex-col items-center gap-6 select-none sm:gap-8">
            <div
                className="relative aspect-square w-full max-w-[min(72vw,72svh,520px)]"
                style={{ touchAction: 'manipulation' }}
            >
                {/* Ambient glow behind the wheel — non-rotating, circular. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-[-8%] rounded-full"
                    style={{
                        background: `radial-gradient(circle at 50% 50%, ${theme.accent}33 0%, transparent 60%)`,
                        filter: 'blur(28px)',
                    }}
                />

                {/* Hard cast shadow — sits BEHIND the rotating wheel so the shadow
                    never inherits the SVG's rectangular filter region. Without this,
                    the drop-shadow on the rotating SVG renders as a visible square
                    halo when the wheel spins. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-[6%] rounded-full"
                    style={{
                        boxShadow: '0 30px 50px rgba(0,0,0,0.55)',
                    }}
                />

                <motion.svg
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    role="button"
                    aria-label={buttonLabel}
                    tabIndex={0}
                    onClick={handleSpin}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSpin();
                        }
                    }}
                    className="relative z-10 h-full w-full cursor-pointer outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none"
                    animate={controls}
                    initial={{ rotate: 0 }}
                    style={{
                        transformOrigin: '50% 50%',
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    <defs>
                        {theme.sliceColors.map((c, i) => {
                            const next = theme.sliceColors[(i + 1) % theme.sliceColors.length];
                            return (
                                <linearGradient
                                    key={i}
                                    id={sliceGradId(i)}
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor={c} />
                                    <stop offset="100%" stopColor={next} />
                                </linearGradient>
                            );
                        })}
                        {/* Beveled metallic rim — three concentric bands fake an
                            embossed bezel. Outer dark, inner-bright reflective ring,
                            base rim color. */}
                        <radialGradient id={rimGradId} cx="50%" cy="50%" r="50%">
                            <stop offset="86%" stopColor="rgba(0,0,0,0)" />
                            <stop offset="90%" stopColor={theme.rim} stopOpacity="0.7" />
                            <stop offset="94%" stopColor={theme.rimHighlight} stopOpacity="0.85" />
                            <stop offset="98%" stopColor={theme.rim} />
                            <stop offset="100%" stopColor="#000" stopOpacity="0.6" />
                        </radialGradient>
                        <radialGradient id={innerHubId} cx="50%" cy="35%" r="65%">
                            <stop offset="0%" stopColor={theme.rimHighlight} />
                            <stop offset="60%" stopColor={theme.surface} />
                            <stop offset="100%" stopColor={theme.background} />
                        </radialGradient>
                        {/* Per-wedge inner shadow filter for depth — soft dark
                            edge inside each slice, plus a top highlight. */}
                        <filter id={`${reactId}-wedge`} x="-10%" y="-10%" width="120%" height="120%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
                            <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
                            <feComponentTransfer in="offsetBlur" result="darker">
                                <feFuncA type="linear" slope="0.7" />
                            </feComponentTransfer>
                            <feComposite in="darker" in2="SourceAlpha" operator="in" result="innerShadow" />
                            <feMerge>
                                <feMergeNode in="SourceGraphic" />
                                <feMergeNode in="innerShadow" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Outer dark bezel ring */}
                    <circle cx={cx} cy={cy} r={radius + 22} fill="#000" opacity="0.9" />
                    {/* Mid metallic rim with subtle gradient */}
                    <circle cx={cx} cy={cy} r={radius + 16} fill={theme.rim} />
                    {/* Polished inner highlight ring */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 9}
                        fill="none"
                        stroke={`url(#${rimGradId})`}
                        strokeWidth={10}
                    />
                    {/* Tight bright bevel just outside the wedges */}
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius + 2}
                        fill="none"
                        stroke={theme.rimHighlight}
                        strokeOpacity={0.35}
                        strokeWidth={1.5}
                    />

                    {/* Wedges */}
                    {wedges.map((w) => (
                        <g key={w.key} filter={`url(#${reactId}-wedge)`}>
                            <path
                                d={w.d}
                                fill={w.fill}
                                stroke="rgba(0,0,0,0.55)"
                                strokeWidth={1.5}
                            />
                            {w.image && (
                                <image
                                    href={w.image}
                                    x={w.imagePos.x - 28}
                                    y={w.imagePos.y - 28}
                                    width={56}
                                    height={56}
                                    preserveAspectRatio="xMidYMid meet"
                                    transform={`rotate(${w.labelAngleDeg}, ${w.imagePos.x}, ${w.imagePos.y})`}
                                />
                            )}
                            <text
                                x={w.labelPos.x}
                                y={w.labelPos.y}
                                fill={theme.sliceTextColor}
                                fontSize={Math.max(14, SIZE * 0.024)}
                                fontWeight={700}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${w.labelAngleDeg}, ${w.labelPos.x}, ${w.labelPos.y})`}
                                style={{ letterSpacing: '0.02em' }}
                            >
                                {w.label}
                            </text>
                        </g>
                    ))}

                    {/* Pegs around the rim */}
                    {pegStyle !== 'none' &&
                        pegs.map((p, i) => {
                            const isOn = pegStyle === 'lights' ? i % 2 === 0 : true;
                            return (
                                <circle
                                    key={`peg-${i}`}
                                    cx={p.x}
                                    cy={p.y}
                                    r={p.r}
                                    fill={isOn ? theme.pegOn : theme.pegOff}
                                    stroke="rgba(0,0,0,0.4)"
                                    strokeWidth={1}
                                />
                            );
                        })}

                    {/* Center hub — style varies based on hubStyle */}
                    {hubStyle === 'minimal' ? (
                        <circle
                            cx={cx}
                            cy={cy}
                            r={radius * 0.08}
                            fill={theme.surface}
                            stroke={theme.rim}
                            strokeWidth={2}
                        />
                    ) : hubStyle === 'logo' && brandLogoUrl ? (
                        <>
                            <circle cx={cx} cy={cy} r={radius * 0.2} fill={theme.surface} stroke={theme.rim} strokeWidth={2} />
                            <image
                                href={brandLogoUrl}
                                x={cx - radius * 0.16}
                                y={cy - radius * 0.16}
                                width={radius * 0.32}
                                height={radius * 0.32}
                                preserveAspectRatio="xMidYMid meet"
                            />
                        </>
                    ) : hubStyle === 'starburst' ? (
                        <>
                            <circle cx={cx} cy={cy} r={radius * 0.2} fill={`url(#${innerHubId})`} stroke={theme.rim} strokeWidth={2} />
                            {Array.from({ length: 12 }, (_, i) => {
                                const a = (i * Math.PI) / 6;
                                const r1 = radius * 0.06;
                                const r2 = radius * 0.16;
                                return (
                                    <line
                                        key={i}
                                        x1={cx + Math.cos(a) * r1}
                                        y1={cy + Math.sin(a) * r1}
                                        x2={cx + Math.cos(a) * r2}
                                        y2={cy + Math.sin(a) * r2}
                                        stroke={theme.accent}
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                    />
                                );
                            })}
                            <circle cx={cx} cy={cy} r={radius * 0.05} fill={theme.accent} />
                        </>
                    ) : (
                        <>
                            <circle cx={cx} cy={cy} r={radius * 0.18} fill={`url(#${innerHubId})`} stroke={theme.rim} strokeWidth={2} />
                            <circle cx={cx} cy={cy} r={radius * 0.06} fill={theme.accent} />
                        </>
                    )}
                </motion.svg>

                {/* Static glossy highlight — sits OUTSIDE the rotating SVG so the
                    light source feels fixed instead of sweeping with the wheel. */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-[6%] z-10 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 28%, rgba(255,255,255,0) 55%)',
                    }}
                />

                {/* Stationary pointer at top, OUTSIDE the rotating wheel */}
                <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center">
                    <motion.svg
                        width={56}
                        height={76}
                        viewBox="0 0 56 76"
                        className="-mt-2"
                        animate={isSpinning ? { rotate: [0, -10, 8, -6, 0] } : { rotate: 0 }}
                        transition={
                            isSpinning
                                ? { duration: 0.18, repeat: Infinity, repeatType: 'mirror' }
                                : { duration: 0.4 }
                        }
                        style={{ transformOrigin: '50% 12%' }}
                    >
                        <defs>
                            <linearGradient id={`${reactId}-pointer`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={theme.rimHighlight} />
                                <stop offset="100%" stopColor={theme.pointer} />
                            </linearGradient>
                        </defs>
                        {pointerStyle === 'arrow' ? (
                            <path
                                d="M28 70 L8 22 L20 22 L20 4 L36 4 L36 22 L48 22 Z"
                                fill={`url(#${reactId}-pointer)`}
                                stroke="rgba(0,0,0,0.6)"
                                strokeWidth={1.5}
                            />
                        ) : pointerStyle === 'flag' ? (
                            <>
                                <rect x="26" y="0" width="4" height="74" fill={theme.rim} />
                                <path
                                    d="M30 4 L52 14 L30 24 Z"
                                    fill={`url(#${reactId}-pointer)`}
                                    stroke="rgba(0,0,0,0.6)"
                                    strokeWidth={1.5}
                                />
                                <circle cx={28} cy={70} r={5} fill={theme.rim} />
                            </>
                        ) : pointerStyle === 'triangle' ? (
                            <path
                                d="M28 68 L6 6 L50 6 Z"
                                fill={`url(#${reactId}-pointer)`}
                                stroke="rgba(0,0,0,0.6)"
                                strokeWidth={1.5}
                            />
                        ) : pointerStyle === 'pin' ? (
                            <>
                                <path
                                    d="M28 72 L24 32 Q24 14 28 6 Q32 14 32 32 Z"
                                    fill={`url(#${reactId}-pointer)`}
                                    stroke="rgba(0,0,0,0.6)"
                                    strokeWidth={1.5}
                                />
                                <circle cx={28} cy={20} r={6} fill={theme.rim} stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
                            </>
                        ) : pointerStyle === 'ball' ? (
                            <>
                                <rect x="26" y="14" width="4" height="56" fill={theme.rim} />
                                <circle cx={28} cy={14} r={12} fill={`url(#${reactId}-pointer)`} stroke="rgba(0,0,0,0.6)" strokeWidth={1.5} />
                                <circle cx={24} cy={10} r={3} fill="rgba(255,255,255,0.55)" />
                            </>
                        ) : pointerStyle === 'diamond' ? (
                            <path
                                d="M28 70 L8 36 L28 4 L48 36 Z"
                                fill={`url(#${reactId}-pointer)`}
                                stroke="rgba(0,0,0,0.6)"
                                strokeWidth={1.5}
                            />
                        ) : (
                            <>
                                <path
                                    d="M28 70 L4 12 Q28 0 52 12 Z"
                                    fill={`url(#${reactId}-pointer)`}
                                    stroke="rgba(0,0,0,0.6)"
                                    strokeWidth={1.5}
                                />
                                <circle cx={28} cy={12} r={4} fill={theme.rim} />
                            </>
                        )}
                    </motion.svg>
                </div>

                {/* Center label overlay — only on classic hub */}
                {hubStyle === 'classic' && (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                    <div
                        className="flex h-[18%] w-[18%] flex-col items-center justify-center rounded-full text-[9px] font-semibold tracking-[0.3em] uppercase"
                        style={{
                            color: theme.mutedText,
                            background: theme.surface,
                            border: `1px solid ${theme.panel}`,
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 30px rgba(0,0,0,0.5)',
                        }}
                    >
                        {labels?.hubText ?? 'Spin'}
                    </div>
                </div>
                )}
            </div>

            <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning || disabled}
                className="rounded-full px-12 py-4 text-sm font-semibold tracking-[0.2em] uppercase transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                    background: theme.accent,
                    color: theme.background,
                    boxShadow: `0 12px 30px ${theme.accent}55`,
                }}
            >
                {buttonLabel}
            </button>
        </div>
    );
}
