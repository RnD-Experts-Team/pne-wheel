import { Head, router } from '@inertiajs/react';
import { Volume2, VolumeX } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import ConfettiBurst from '@/components/confetti-burst';
import PrizeWheel, {
    type HubStyle,
    type PegStyle,
    type PointerStyle,
    type PrizeWheelItem,
} from '@/components/prize-wheel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import WheelPublicLayout from '@/layouts/wheel/wheel-public-layout';
import { resolveTheme, type CustomPalette, type WheelThemeKey } from '@/lib/wheel-themes';

type PublicWheel = {
    id: number;
    slug: string;
    name: string;
    brand_name: string;
    brand_logo_url: string | null;
    address: string | null;
    theme: WheelThemeKey;
    brand_color: string | null;
    custom_palette: CustomPalette | null;
    hub_style: HubStyle;
    pointer_style: PointerStyle;
    peg_style: PegStyle;
    number_of_fields: number | null;
    sound_enabled: boolean;
    confetti_enabled: boolean;
    items: PrizeWheelItem[];
};

type Props = {
    wheel: PublicWheel;
    spinEndpoint: string;
};

export default function WheelPage({ wheel, spinEndpoint }: Props) {
    const theme = useMemo(
        () => resolveTheme(wheel.theme, wheel.brand_color, wheel.custom_palette),
        [wheel.theme, wheel.brand_color, wheel.custom_palette],
    );
    const [muted, setMuted] = useState(!wheel.sound_enabled);
    const [winner, setWinner] = useState<PrizeWheelItem | null>(null);
    const [confettiActive, setConfettiActive] = useState(false);

    const resolveWinner = useCallback(async (): Promise<{ index: number }> => {
        const csrfToken =
            document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

        const res = await fetch(spinEndpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken,
            },
            credentials: 'same-origin',
        });

        if (!res.ok) {
            throw new Error(`Spin request failed: ${res.status}`);
        }
        return (await res.json()) as { index: number };
    }, [spinEndpoint]);

    const onSpinComplete = useCallback(
        (won: PrizeWheelItem) => {
            setWinner(won);
            if (wheel.confetti_enabled) {
                setConfettiActive(true);
                window.setTimeout(() => setConfettiActive(false), 3500);
            }
        },
        [wheel.confetti_enabled],
    );

    const brandPanel = (
        <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
            {wheel.brand_logo_url ? (
                <img
                    src={wheel.brand_logo_url}
                    alt={`شعار ${wheel.brand_name}`}
                    className="h-24 w-auto max-w-[60%] object-contain"
                />
            ) : (
                <p
                    className="text-xs font-semibold tracking-[0.4em] uppercase"
                    style={{ color: theme.mutedText }}
                >
                    {wheel.brand_name}
                </p>
            )}

            <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {wheel.brand_name}
                </h1>
                {wheel.address && (
                    <p className="text-sm sm:text-base" style={{ color: theme.mutedText }}>
                        {wheel.address}
                    </p>
                )}
            </div>

            <div
                className="rounded-xl px-5 py-4 text-sm leading-relaxed"
                style={{ background: theme.panel, color: theme.mutedText }}
            >
                اضغط على العجلة — أو الزر تحتها — للفوز.
                {wheel.confetti_enabled && ' وعند الفوز ستحصل على انفجار من الكونفيتي.'}
            </div>

            <div className="flex w-full items-center justify-center gap-3">
                {wheel.sound_enabled && (
                    <button
                        type="button"
                        onClick={() => setMuted((m) => !m)}
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                            background: theme.panel,
                            color: theme.mutedText,
                        }}
                        aria-pressed={muted}
                    >
                        {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                        {muted ? 'الصوت مغلق' : 'الصوت مفعّل'}
                    </button>
                )}
            </div>

            <span
                className="text-[10px] tracking-[0.3em] uppercase"
                style={{ color: theme.mutedText }}
            >
                CallMe Wheel
            </span>
        </div>
    );

    return (
        <>
            <Head title={wheel.brand_name || wheel.name} />
            <WheelPublicLayout theme={theme} brand={brandPanel}>
                <PrizeWheel
                    items={wheel.items}
                    numberOfFields={wheel.number_of_fields}
                    theme={theme}
                    hubStyle={wheel.hub_style}
                    pointerStyle={wheel.pointer_style}
                    pegStyle={wheel.peg_style}
                    brandLogoUrl={wheel.brand_logo_url}
                    muted={muted}
                    labels={{
                        spin: 'اضغط للدوران',
                        spinning: 'جارٍ الدوران…',
                        spinAgain: 'ادر مرة أخرى',
                        hubText: 'إدارة',
                    }}
                    resolveWinner={resolveWinner}
                    onSpinComplete={onSpinComplete}
                />
            </WheelPublicLayout>

            {wheel.confetti_enabled && (
                <ConfettiBurst
                    active={confettiActive}
                    colors={[theme.accent, theme.pegOn, theme.rimHighlight, ...theme.sliceColors]}
                />
            )}

            <Dialog
                open={winner !== null}
                onOpenChange={(open) => {
                    if (!open) setWinner(null);
                }}
            >
                <DialogContent
                    className="border-0 text-center"
                    style={{
                        background: theme.surface,
                        color: theme.text,
                        borderColor: theme.panel,
                    }}
                >
                    <DialogHeader className="text-center sm:text-center">
                        <DialogTitle className="text-3xl font-semibold tracking-tight">
                            مبروك، لقد فزت!
                        </DialogTitle>
                        <DialogDescription style={{ color: theme.mutedText }}>
                            اعرض هذه الشاشة عند الكاشير لاستلام الجائزة.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center justify-center gap-4 py-2">
                        {winner?.image_url && (
                            <div
                                className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg"
                                style={{ background: theme.panel }}
                            >
                                <img
                                    src={winner.image_url}
                                    alt=""
                                    className="max-h-full max-w-full"
                                />
                            </div>
                        )}
                        <div className="text-2xl font-semibold" style={{ color: theme.accent }}>
                            {winner?.label}
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-center">
                        <Button
                            type="button"
                            onClick={() => {
                                setWinner(null);
                                router.reload({ only: [] });
                            }}
                            style={{ background: theme.accent, color: theme.background }}
                        >
                            ادر مرة أخرى
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
