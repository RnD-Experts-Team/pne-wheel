import { useEffect, useRef } from 'react';

type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    vr: number;
    size: number;
    color: string;
    life: number;
};

const COLORS = [
    '#fde047', '#f87171', '#34d399', '#60a5fa', '#c084fc',
    '#fb923c', '#f472b6', '#a3e635',
];

type Props = {
    active: boolean;
    /** Optional palette override — pass theme accent colors for harmony. */
    colors?: string[];
};

export default function ConfettiBurst({ active, colors = COLORS }: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animRef = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    useEffect(() => {
        if (!active) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        };
        resize();
        window.addEventListener('resize', resize);

        const w = canvas.width;
        const h = canvas.height;
        const count = 160;
        particlesRef.current = Array.from({ length: count }, () => ({
            x: w / 2,
            y: h * 0.35,
            vx: (Math.random() - 0.5) * 18 * window.devicePixelRatio,
            vy: (Math.random() * -16 - 6) * window.devicePixelRatio,
            rot: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.4,
            size: (5 + Math.random() * 5) * window.devicePixelRatio,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
        }));

        const gravity = 0.5 * window.devicePixelRatio;
        const drag = 0.992;

        const tick = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = false;
            for (const p of particlesRef.current) {
                p.vy += gravity;
                p.vx *= drag;
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vr;
                p.life -= 0.006;
                if (p.life <= 0 || p.y > canvas.height + 40) continue;
                alive = true;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                ctx.restore();
            }
            if (alive) {
                animRef.current = requestAnimationFrame(tick);
            }
        };
        tick();

        return () => {
            window.removeEventListener('resize', resize);
            if (animRef.current) cancelAnimationFrame(animRef.current);
            particlesRef.current = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        };
    }, [active, colors]);

    if (!active) return null;
    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none fixed inset-0 z-[60] h-full w-full"
            aria-hidden
        />
    );
}
