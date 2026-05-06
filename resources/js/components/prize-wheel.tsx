import { motion, useAnimationControls } from 'framer-motion';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react';
import type { WheelTheme } from '@/lib/wheel-themes';

export type PrizeWheelItem = {
    id: string | number;
    label: string;
    image_url?: string | null;
};

export type HubStyle = 'classic' | 'minimal' | 'logo' | 'starburst';
export type PointerStyle =
    | 'classic'
    | 'arrow'
    | 'flag'
    | 'triangle'
    | 'pin'
    | 'ball'
    | 'diamond'
    | 'needle'
    | 'spear'
    | 'crown';
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
const DRAG_RING_INNER_FRACTION = 0.72;
const DRAG_RING_OUTER_PADDING = 34;
const DRAG_MIN_MOVEMENT = 8;
const DRAG_MIN_ROTATION = 0.12;

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

const wrapLabelLines = (label: string, maxCharsPerLine: number, maxLines = 3): string[] => {
    const normalized = label.trim().replace(/\s+/g, ' ');
    if (!normalized) {
        return [''];
    }

    const words = normalized.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length <= maxCharsPerLine) {
            current = candidate;
            continue;
        }

        if (current) {
            lines.push(current);
            current = '';
        }

        if (word.length <= maxCharsPerLine) {
            current = word;
            continue;
        }

        let rest = word;
        while (rest.length > maxCharsPerLine) {
            lines.push(rest.slice(0, maxCharsPerLine - 1) + '…');
            rest = rest.slice(maxCharsPerLine - 1);
            if (lines.length >= maxLines) {
                return lines.slice(0, maxLines);
            }
        }
        current = rest;

        if (lines.length >= maxLines) {
            return lines.slice(0, maxLines);
        }
    }

    if (current) {
        lines.push(current);
    }

    if (lines.length <= maxLines) {
        return lines;
    }

    const trimmed = lines.slice(0, maxLines);
    const lastIndex = trimmed.length - 1;
    trimmed[lastIndex] = trimmed[lastIndex].replace(/\u2026?$/, '') + '…';
    return trimmed;
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
    const markerControls = useAnimationControls();
    const reactId = useId();
    const sliceGradId = useCallback((i: number) => `${reactId}-slice-${i}`, [reactId]);
    const rimGradId = `${reactId}-rim`;
    const innerHubId = `${reactId}-hub`;
    const textureId = `${reactId}-texture`;
    const vignetteId = `${reactId}-vignette`;
    const spokeShadowId = `${reactId}-spoke-shadow`;

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
    const lastTickSampleRef = useRef<{ time: number; rotation: number } | null>(null);
    const tickAudioRef = useRef<((volume?: number) => void) | null>(null);
    const fanfareAudioRef = useRef<((volume?: number) => void) | null>(null);
    const impactAudioRef = useRef<((volume?: number) => void) | null>(null);
    const dragStateRef = useRef<{
        active: boolean;
        pointerId: number | null;
        lastAngle: number;
        accumulatedAngle: number;
        movement: number;
        lastX: number;
        lastY: number;
    }>({
        active: false,
        pointerId: null,
        lastAngle: 0,
        accumulatedAngle: 0,
        movement: 0,
        lastX: 0,
        lastY: 0,
    });

    // Lazily import the sound module so it never blocks the initial render and
    // so SSR never sees `window`.
    useEffect(() => {
        let cancelled = false;
        void import('@/lib/wheel-sound').then((m) => {
            if (!cancelled) {
                tickAudioRef.current = m.playTick;
                fanfareAudioRef.current = m.playFanfare;
                impactAudioRef.current = m.playImpact;
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
        const maxCharsPerLine =
            sliceCount >= 16 ? 6 :
            sliceCount >= 12 ? 8 :
            sliceCount >= 10 ? 10 : 12;
        const labelFontSize =
            sliceCount >= 16 ? Math.max(10, SIZE * 0.017) :
            sliceCount >= 12 ? Math.max(11, SIZE * 0.0195) :
            Math.max(12, SIZE * 0.023);

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
                wrappedLabelLines: wrapLabelLines(item.label, maxCharsPerLine, 3),
                d: wedgePath(cx, cy, radius, startRad, endRad),
                fill: `url(#${sliceGradId(fillIndex)})`,
                labelPos,
                imagePos,
                labelAngleDeg,
                fillIndex,
                labelFontSize,
            };
        });
    }, [slices, sliceAngleRad, cx, cy, radius, labelRadius, imageRadius, theme.sliceColors.length, sliceCount, sliceGradId]);

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
            lastTickSampleRef.current = null;

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
                    const lastSample = lastTickSampleRef.current;
                    const dt = lastSample ? Math.max(1, now - lastSample.time) : 16;
                    const dRot = lastSample ? Math.abs(current - lastSample.rotation) : Math.abs(totalDelta / Math.max(durationMs, 1));
                    const angularVelocity = dRot / dt; // deg/ms
                    const normalizedSpeed = Math.min(1, angularVelocity / 0.85);
                    const flickAngle = 1.3 + normalizedSpeed * 3.4;
                    const flickDrop = 0.35 + normalizedSpeed * 1.7;
                    const flickDuration = 0.065 + (1 - normalizedSpeed) * 0.09;

                    lastTickedSliceRef.current = sliceIndex;
                    lastTickSampleRef.current = { time: now, rotation: current };
                    // Fade tick volume as we slow.
                    const volume = 0.05 + 0.18 * (1 - eased);
                    tickAudioRef.current?.(volume);

                    void markerControls.start({
                        rotate: [0, -flickAngle, flickAngle * 0.58, -flickAngle * 0.36, 0],
                        y: [0, flickDrop, -flickDrop * 0.28, flickDrop * 0.16, 0],
                        transition: {
                            duration: flickDuration,
                            ease: 'linear',
                            times: [0, 0.22, 0.52, 0.8, 1],
                        },
                    });
                }
                if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        },
        [markerControls, muted, sliceCount, sliceAngleDeg],
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
            const dynamicRotations = FULL_ROTATIONS + Math.random() * 1.75;
            const spinDuration = SPIN_DURATION + Math.min(1.1, sliceCount * 0.022) + Math.random() * 0.35;
            const next = rotation + dynamicRotations * 360 + (settle - (rotation % 360));

            driveTicks(rotation, next, spinDuration * 1000);

            // Real wheels overshoot, rebound, then settle.
            const overshoot = next + sliceAngleDeg * (SETTLE_OVERSHOOT_FRACTION + 0.04);
            const rebound = next - sliceAngleDeg * 0.045;
            await controls.start({
                rotate: [rotation, overshoot, rebound, next],
                transition: {
                    type: 'tween',
                    duration: spinDuration,
                    times: [0, 0.86, 0.94, 1],
                    ease: [
                        [0.14, 0.9, 0.2, 1],
                        [0.24, 0, 0.52, 1],
                        [0.28, 0.88, 0.35, 1],
                    ],
                },
            });

            setRotation(next);
            const won = slices[targetIndex];
            setWinner(won);
            setHasSpunOnce(true);

            if (!muted) {
                impactAudioRef.current?.(0.24);
            }

            const settleKick = Math.max(1.4, Math.min(3.4, sliceAngleDeg * 0.085));
            await markerControls.start({
                rotate: [0, -settleKick, settleKick * 0.62, -settleKick * 0.34, 0],
                y: [0, 1.2, -0.55, 0.25, 0],
                transition: {
                    duration: 0.24,
                    ease: 'easeOut',
                    times: [0, 0.2, 0.5, 0.78, 1],
                },
            });

            if (!muted) fanfareAudioRef.current?.();
            onSpinComplete?.(won);
        } finally {
            await markerControls.start({ rotate: 0, y: 0, transition: { duration: 0.18 } });
            setIsSpinning(false);
        }
    }, [
        isSpinning, disabled, sliceCount, resolveWinner, sliceAngleDeg, rotation,
        driveTicks, controls, markerControls, slices, muted, onSpinComplete,
    ]);

    const mapPointerToWheel = useCallback((event: { clientX: number; clientY: number }, rect: DOMRect) => {
        const x = (event.clientX - rect.left) * (SIZE / rect.width);
        const y = (event.clientY - rect.top) * (SIZE / rect.height);
        return { x, y };
    }, [SIZE]);

    const handleWheelPointerDown = useCallback((event: PointerEvent<SVGSVGElement>) => {
        if (isSpinning || disabled || sliceCount === 0) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const point = mapPointerToWheel(event, rect);
        const distanceFromCenter = Math.hypot(point.x - cx, point.y - cy);
        const dragRingInnerRadius = radius * DRAG_RING_INNER_FRACTION;
        const dragRingOuterRadius = radius + DRAG_RING_OUTER_PADDING;

        if (distanceFromCenter < dragRingInnerRadius || distanceFromCenter > dragRingOuterRadius) {
            return;
        }

        const angle = Math.atan2(point.y - cy, point.x - cx);

        dragStateRef.current = {
            active: true,
            pointerId: event.pointerId,
            lastAngle: angle,
            accumulatedAngle: 0,
            movement: 0,
            lastX: point.x,
            lastY: point.y,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
    }, [cx, cy, disabled, isSpinning, mapPointerToWheel, radius, sliceCount]);

    const handleWheelPointerMove = useCallback((event: PointerEvent<SVGSVGElement>) => {
        const drag = dragStateRef.current;
        if (!drag.active || drag.pointerId !== event.pointerId) {
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const point = mapPointerToWheel(event, rect);
        const angle = Math.atan2(point.y - cy, point.x - cx);

        let delta = angle - drag.lastAngle;
        if (delta > Math.PI) {
            delta -= TAU;
        }
        if (delta < -Math.PI) {
            delta += TAU;
        }

        drag.accumulatedAngle += delta;
        drag.movement += Math.hypot(point.x - drag.lastX, point.y - drag.lastY);
        drag.lastAngle = angle;
        drag.lastX = point.x;
        drag.lastY = point.y;
    }, [cx, cy, mapPointerToWheel]);

    const handleWheelPointerUp = useCallback((event: PointerEvent<SVGSVGElement>) => {
        const drag = dragStateRef.current;
        if (!drag.active || drag.pointerId !== event.pointerId) {
            return;
        }

        drag.active = false;
        drag.pointerId = null;

        event.currentTarget.releasePointerCapture(event.pointerId);

        const movedEnough = drag.movement >= DRAG_MIN_MOVEMENT;
        const rotatedEnough = Math.abs(drag.accumulatedAngle) >= DRAG_MIN_ROTATION;

        if (movedEnough && rotatedEnough) {
            void handleSpin();
        }
    }, [handleSpin]);

    const handleWheelPointerCancel = useCallback((event: PointerEvent<SVGSVGElement>) => {
        const drag = dragStateRef.current;
        if (drag.pointerId !== event.pointerId) {
            return;
        }

        drag.active = false;
        drag.pointerId = null;

        event.currentTarget.releasePointerCapture(event.pointerId);
    }, []);

    const buttonLabel = isSpinning
        ? (labels?.spinning ?? 'Spinning…')
        : hasSpunOnce
          ? (labels?.spinAgain ?? 'Spin again')
          : (labels?.spin ?? 'Tap to spin');

        // Slightly shorter center marker so it feels more proportional.
        const pointerTipY = cy - radius + 8;
        const pointerNeckY = cy - radius * 0.64;
        const pointerBodyY = cy - radius * 0.4;
        const pointerStemTopY = cy - radius * 0.16;

    return (
        <div className="flex w-full flex-col items-center gap-6 select-none sm:gap-8">
            <div
                className="relative aspect-square w-full max-w-[min(72vw,72svh,520px)]"
                style={{ touchAction: 'none' }}
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
                        boxShadow: '0 32px 56px rgba(0,0,0,0.55), inset 0 -12px 22px rgba(0,0,0,0.28)',
                    }}
                />

                <motion.svg
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                    onPointerDown={handleWheelPointerDown}
                    onPointerMove={handleWheelPointerMove}
                    onPointerUp={handleWheelPointerUp}
                    onPointerCancel={handleWheelPointerCancel}
                    className="relative z-10 h-full w-full cursor-grab outline-none [-webkit-tap-highlight-color:transparent] active:cursor-grabbing"
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
                        <radialGradient id={vignetteId} cx="50%" cy="50%" r="55%">
                            <stop offset="72%" stopColor="rgba(0,0,0,0)" />
                            <stop offset="95%" stopColor="rgba(0,0,0,0.28)" />
                            <stop offset="100%" stopColor="rgba(0,0,0,0.5)" />
                        </radialGradient>
                        <pattern id={textureId} width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(17)">
                            <rect width="22" height="22" fill="rgba(255,255,255,0.012)" />
                            <line x1="0" y1="0" x2="0" y2="22" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
                            <line x1="11" y1="0" x2="11" y2="22" stroke="rgba(0,0,0,0.09)" strokeWidth="0.9" />
                        </pattern>
                        <filter id={spokeShadowId} x="-12%" y="-12%" width="124%" height="124%">
                            <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#000" floodOpacity="0.32" />
                        </filter>
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
                                fontSize={w.labelFontSize}
                                fontWeight={700}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${w.labelAngleDeg}, ${w.labelPos.x}, ${w.labelPos.y})`}
                                style={{ letterSpacing: '0.01em' }}
                            >
                                {w.wrappedLabelLines.map((line, idx) => (
                                    <tspan
                                        key={`${w.key}-line-${idx}`}
                                        x={w.labelPos.x}
                                        dy={idx === 0 ? `${-((w.wrappedLabelLines.length - 1) * 0.56)}em` : '1.12em'}
                                    >
                                        {line}
                                    </tspan>
                                ))}
                            </text>
                        </g>
                    ))}

                    {/* Global texture and depth layers to reduce flat appearance. */}
                    <circle cx={cx} cy={cy} r={radius - 1.5} fill={`url(#${textureId})`} opacity={0.42} />
                    <circle cx={cx} cy={cy} r={radius - 1.5} fill={`url(#${vignetteId})`} opacity={0.95} />
                    <circle
                        cx={cx}
                        cy={cy}
                        r={radius - 2.5}
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth={1.4}
                    />

                    {Array.from({ length: sliceCount }, (_, i) => {
                        const startRad = -Math.PI / 2 - sliceAngleRad / 2 + i * sliceAngleRad;
                        const inner = polar(cx, cy, radius * 0.2, startRad);
                        const outer = polar(cx, cy, radius - 5, startRad);

                        return (
                            <line
                                key={`spoke-shadow-${i}`}
                                x1={inner.x}
                                y1={inner.y}
                                x2={outer.x}
                                y2={outer.y}
                                stroke="rgba(0,0,0,0.22)"
                                strokeWidth={1.1}
                                filter={`url(#${spokeShadowId})`}
                            />
                        );
                    })}

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

                {/* Stationary center-anchored marker — points to top winning sector. */}
                <div className="pointer-events-none absolute inset-[6%] z-20">
                    <motion.svg
                        viewBox={`0 0 ${SIZE} ${SIZE}`}
                        className="h-full w-full"
                        animate={markerControls}
                        initial={{ rotate: 0, y: 0 }}
                        style={{ transformOrigin: '50% 50%' }}
                    >
                        <defs>
                            <linearGradient id={`${reactId}-pointer`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={theme.rimHighlight} />
                                <stop offset="100%" stopColor={theme.pointer} />
                            </linearGradient>
                        </defs>

                        {pointerStyle === 'arrow' ? (
                            <>
                                <rect
                                    x={cx - 6}
                                    y={pointerStemTopY}
                                    width={12}
                                    height={cy - pointerStemTopY + 4}
                                    rx={5}
                                    fill={theme.rim}
                                    opacity={0.95}
                                />
                                <path
                                    d={`M ${cx} ${pointerTipY} L ${cx - 26} ${pointerNeckY} L ${cx - 10} ${pointerNeckY} L ${cx - 10} ${pointerBodyY} L ${cx + 10} ${pointerBodyY} L ${cx + 10} ${pointerNeckY} L ${cx + 26} ${pointerNeckY} Z`}
                                    fill={`url(#${reactId}-pointer)`}
                                    stroke="rgba(0,0,0,0.6)"
                                    strokeWidth={2}
                                />
                            </>
                        ) : pointerStyle === 'flag' ? (
                            <>
                                <rect x={cx - 4} y={pointerTipY} width={8} height={cy - pointerTipY + 8} fill={theme.rim} />
                                <path
                                    d={`M ${cx + 5} ${pointerNeckY - 16} L ${cx + 60} ${pointerNeckY + 4} L ${cx + 5} ${pointerNeckY + 22} Z`}
                                    fill={`url(#${reactId}-pointer)`}
                                    stroke="rgba(0,0,0,0.55)"
                                    strokeWidth={2}
                                />
                            </>
                        ) : pointerStyle === 'triangle' ? (
                            <path
                                d={`M ${cx} ${pointerTipY} L ${cx - 30} ${cy + 2} L ${cx + 30} ${cy + 2} Z`}
                                fill={`url(#${reactId}-pointer)`}
                                stroke="rgba(0,0,0,0.6)"
                                strokeWidth={2}
                            />
                        ) : pointerStyle === 'pin' ? (
                            <>
                                <path
                                    d={`M ${cx} ${pointerTipY} L ${cx - 8} ${pointerNeckY + 16} Q ${cx - 6} ${cy - 16} ${cx - 3} ${cy + 6} L ${cx + 3} ${cy + 6} Q ${cx + 6} ${cy - 16} ${cx + 8} ${pointerNeckY + 16} Z`}
                                    fill={`url(#${reactId}-pointer)`}
                                    stroke="rgba(0,0,0,0.6)"
                                    strokeWidth={2}
                                />
                                <circle cx={cx} cy={cy - 62} r={12} fill={theme.rim} stroke="rgba(0,0,0,0.4)" strokeWidth={2} />
                            </>
                        ) : pointerStyle === 'ball' ? (
                            <>
                                <rect x={cx - 3} y={pointerTipY + 14} width={6} height={cy - pointerTipY + 8} fill={theme.rim} />
                                <circle cx={cx} cy={pointerTipY + 12} r={18} fill={`url(#${reactId}-pointer)`} stroke="rgba(0,0,0,0.6)" strokeWidth={2} />
                                <circle cx={cx - 6} cy={pointerTipY + 4} r={5} fill="rgba(255,255,255,0.55)" />
                            </>
                        ) : pointerStyle === 'diamond' ? (
                            <path
                                d={`M ${cx} ${pointerTipY} L ${cx - 18} ${pointerNeckY} L ${cx} ${pointerBodyY} L ${cx + 18} ${pointerNeckY} Z M ${cx} ${pointerBodyY} L ${cx - 10} ${cy + 4} L ${cx + 10} ${cy + 4} Z`}
                                fill={`url(#${reactId}-pointer)`}
                                stroke="rgba(0,0,0,0.6)"
                                strokeWidth={2}
                            />
                        ) : pointerStyle === 'needle' ? (
                            <>
                                <path
                                    d={`M ${cx} ${pointerTipY - 4} L ${cx - 6} ${pointerNeckY + 2} L ${cx - 3} ${cy + 5} L ${cx + 3} ${cy + 5} L ${cx + 6} ${pointerNeckY + 2} Z`}
                                    fill={`url(#${reactId}-pointer)`}
                                    stroke="rgba(0,0,0,0.65)"
                                    strokeWidth={1.8}
                                />
                                <circle cx={cx} cy={cy - 5} r={8} fill={theme.rim} stroke="rgba(0,0,0,0.4)" strokeWidth={1.5} />
                            </>
                        ) : pointerStyle === 'spear' ? (
                            <>
                                <path
                                    d={`M ${cx} ${pointerTipY - 2} L ${cx - 16} ${pointerNeckY + 8} L ${cx - 6} ${pointerNeckY + 10} L ${cx - 4} ${cy + 6} L ${cx + 4} ${cy + 6} L ${cx + 6} ${pointerNeckY + 10} L ${cx + 16} ${pointerNeckY + 8} Z`}
                                    fill={`url(#${reactId}-pointer)`}
                                    stroke="rgba(0,0,0,0.65)"
                                    strokeWidth={2}
                                />
                                <rect x={cx - 3} y={pointerNeckY + 10} width={6} height={cy - pointerNeckY - 4} rx={2} fill={theme.rim} />
                            </>
                        ) : pointerStyle === 'crown' ? (
                            <>
                                <path
                                    d={`M ${cx} ${pointerTipY + 2} L ${cx - 8} ${pointerNeckY - 2} L ${cx - 16} ${pointerNeckY + 14} L ${cx - 2} ${pointerNeckY + 12} L ${cx + 2} ${pointerNeckY + 12} L ${cx + 16} ${pointerNeckY + 14} L ${cx + 8} ${pointerNeckY - 2} Z`}
                                    fill={`url(#${reactId}-pointer)`}
                                    stroke="rgba(0,0,0,0.6)"
                                    strokeWidth={2}
                                />
                                <rect x={cx - 12} y={pointerNeckY + 14} width={24} height={10} rx={3} fill={theme.rim} />
                                <path
                                    d={`M ${cx - 6} ${pointerNeckY + 24} L ${cx - 3} ${cy + 5} L ${cx + 3} ${cy + 5} L ${cx + 6} ${pointerNeckY + 24} Z`}
                                    fill={theme.rim}
                                />
                            </>
                        ) : (
                            <>
                                <path
                                    d={`M ${cx} ${pointerTipY} L ${cx - 24} ${pointerNeckY} Q ${cx} ${pointerNeckY - 12} ${cx + 24} ${pointerNeckY} Z`}
                                    fill={`url(#${reactId}-pointer)`}
                                    stroke="rgba(0,0,0,0.6)"
                                    strokeWidth={2}
                                />
                                <path
                                    d={`M ${cx - 10} ${pointerNeckY + 2} L ${cx - 4} ${cy + 4} L ${cx + 4} ${cy + 4} L ${cx + 10} ${pointerNeckY + 2} Z`}
                                    fill={theme.rim}
                                    opacity={0.9}
                                />
                            </>
                        )}

                        {/* Static center cap that visually anchors marker to wheel hub. */}
                        <circle cx={cx} cy={cy} r={11} fill={theme.rimHighlight} stroke={theme.rim} strokeWidth={3} />
                        <circle cx={cx} cy={cy} r={5} fill={theme.pointer} />
                    </motion.svg>
                </div>

                {/* Center trigger button — clickable without showing text on the wheel itself. */}
                <div className="absolute inset-0 z-30 flex items-center justify-center">
                    <button
                        type="button"
                        onClick={() => void handleSpin()}
                        disabled={isSpinning || disabled}
                        aria-label={buttonLabel}
                        className="flex h-[18%] w-[18%] items-center justify-center rounded-full transition-transform active:scale-95 disabled:cursor-not-allowed"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            boxShadow: 'none',
                        }}
                    >
                        <span className="sr-only">{buttonLabel}</span>
                    </button>
                </div>
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
                {isSpinning ? (labels?.spinning ?? 'جارٍ الدوران…') : 'اضغط هنا'}
            </button>
        </div>
    );
}
