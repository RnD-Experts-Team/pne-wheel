import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import type { WheelThemeKey } from '@/lib/wheel-themes';
import { resolveTheme, WHEEL_THEMES } from '@/lib/wheel-themes';
import { dashboard, login } from '@/routes';

type WheelCard = {
    id: number;
    slug: string;
    name: string;
    brand_name: string;
    address: string | null;
    theme: WheelThemeKey;
    brand_logo_url: string | null;
    items_count: number;
    public_url: string;
};

type Props = {
    wheels?: WheelCard[];
};

const WheelGlyph = ({ themeKey }: { themeKey: WheelThemeKey }) => {
    const theme = useMemo(
        () => resolveTheme(themeKey, null, null),
        [themeKey],
    );
    const colors = theme.sliceColors.length > 0 ? theme.sliceColors : ['#222', '#444'];

    return (
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
            <defs>
                <radialGradient id={`g-${themeKey}-rim`} cx="50%" cy="35%" r="55%">
                    <stop offset="0%" stopColor={theme.rimHighlight} />
                    <stop offset="100%" stopColor={theme.rim} />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill={`url(#g-${themeKey}-rim)`} />
            {Array.from({ length: 8 }).map((_, i) => {
                const a0 = (i * Math.PI) / 4 - Math.PI / 2;
                const a1 = ((i + 1) * Math.PI) / 4 - Math.PI / 2;
                const x0 = 50 + 42 * Math.cos(a0);
                const y0 = 50 + 42 * Math.sin(a0);
                const x1 = 50 + 42 * Math.cos(a1);
                const y1 = 50 + 42 * Math.sin(a1);

                return (
                    <path
                        key={i}
                        d={`M50 50 L ${x0} ${y0} A 42 42 0 0 1 ${x1} ${y1} Z`}
                        fill={colors[i % colors.length]}
                        stroke="rgba(0,0,0,0.3)"
                        strokeWidth="0.5"
                    />
                );
            })}
            <circle cx="50" cy="50" r="9" fill={theme.surface} stroke={theme.rim} strokeWidth="1" />
            <circle cx="50" cy="50" r="3" fill={theme.accent} />
        </svg>
    );
};

export default function Welcome({ wheels = [] }: Props) {
    const { auth } = usePage().props as { auth?: { user?: { name?: string } | null } };

    return (
        <>
            <Head title="PNE Wheel" />
            <div className="min-h-svh bg-neutral-950 text-neutral-100">
                <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-amber-300 to-rose-500 shadow-lg shadow-rose-500/30">
                            <Sparkles className="size-4 text-neutral-900" />
                        </div>
                        <div className="leading-tight">
                            <p className="text-sm font-semibold">PNE</p>
                            <p className="text-[10px] tracking-[0.3em] text-neutral-400 uppercase">
                                Rewards Wheel
                            </p>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-2 text-sm">
                        {auth?.user ? (
                            <Link
                                href={dashboard()}
                                className="inline-flex items-center gap-1 rounded-full border border-neutral-800 px-4 py-1.5 hover:bg-neutral-900"
                            >
                                Dashboard
                                <ChevronRight className="size-3.5" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="rounded-full px-4 py-1.5 text-neutral-300 hover:text-white"
                                >
                                    Log in
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <section className="mx-auto w-full max-w-6xl px-4 pt-6 pb-12 text-center sm:px-8">
                    <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                        Published Reward Wheels
                    </h1>
                    <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-400 sm:text-base">
                        Browse reward wheels from stores and brands. Click any wheel and spin to try your luck.
                    </p>
                </section>

                <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-8">
                    {wheels.length === 0 ? (
                        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-neutral-800 p-10 text-center">
                            <p className="text-sm text-neutral-400">
                                No wheels published yet.
                            </p>
                            {auth?.user && (
                                <Link
                                    href={dashboard()}
                                    className="mt-4 inline-flex items-center gap-1 text-sm text-amber-300 hover:text-amber-200"
                                >
                                    Create your first wheel
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            )}
                        </div>
                    ) : (
                        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {wheels.map((w) => {
                                const themeMeta = WHEEL_THEMES[w.theme] ?? WHEEL_THEMES.dark;

                                return (
                                    <li key={w.id}>
                                        <a
                                            href={w.public_url}
                                            className="group block overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 transition-colors hover:border-neutral-700 hover:bg-neutral-900"
                                        >
                                            <div
                                                className="flex aspect-5/3 items-center justify-center p-6"
                                                style={{ background: themeMeta.surface }}
                                            >
                                                <div className="h-32 w-32 transition-transform duration-500 group-hover:rotate-20">
                                                    <WheelGlyph themeKey={w.theme} />
                                                </div>
                                            </div>
                                            <div className="space-y-1 border-t border-neutral-800 p-4">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="truncate font-semibold">{w.brand_name}</h3>
                                                    <span className="shrink-0 text-[10px] tracking-[0.2em] text-neutral-500 uppercase">
                                                        {themeMeta.label}
                                                    </span>
                                                </div>
                                                {w.address && (
                                                    <p className="line-clamp-1 text-xs text-neutral-400">
                                                        {w.address}
                                                    </p>
                                                )}
                                                <p className="text-xs text-neutral-500">
                                                    {w.items_count} items
                                                </p>
                                            </div>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500">
                    PNE Wheel
                </footer>
            </div>
        </>
    );
}
