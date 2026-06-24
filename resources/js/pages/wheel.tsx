import { Head, router } from '@inertiajs/react';
import { Volume2, VolumeX } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import ConfettiBurst from '@/components/confetti-burst';
import PrizeWheel, {
    type HubStyle,
    type PegStyle,
    type PointerStyle,
    type PrizeWheelItem,
} from '@/components/prize-wheel';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
    // Store the authoritative item from the backend so the popup always reflects the server's choice.
    const backendItemRef = useRef<PrizeWheelItem | null>(null);

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
        const data = (await res.json()) as { index: number; item: PrizeWheelItem };
        backendItemRef.current = data.item;
        return { index: data.index };
    }, [spinEndpoint]);

    const onSpinComplete = useCallback(
        (_won: PrizeWheelItem) => {
            setWinner(backendItemRef.current);
            if (wheel.confetti_enabled) {
                setConfettiActive(true);
                window.setTimeout(() => setConfettiActive(false), 3500);
            }
        },
        [wheel.confetti_enabled],
    );

    return (
        <>
            <Head title={wheel.brand_name || wheel.name} />
            <div
                className="relative min-h-svh w-full flex flex-col items-center justify-center overflow-hidden p-4 sm:p-8"
                style={{ background: theme.background, color: theme.text }}
            >
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
                        spin: 'Tap to spin',
                        spinning: 'Spinning…',
                        spinAgain: 'Spin again',
                        hubText: 'SPIN',
                    }}
                    resolveWinner={resolveWinner}
                    onSpinComplete={onSpinComplete}
                />

             
            </div>

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
                            Congratulations, you won!
                        </DialogTitle>
                        <DialogDescription style={{ color: theme.mutedText }}>
                            Show this screen at the cashier to claim your prize.
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
                            Spin again
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

WheelPage.layout = null;
