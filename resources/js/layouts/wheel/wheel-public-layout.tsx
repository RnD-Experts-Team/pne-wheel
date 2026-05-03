import type { ReactNode } from 'react';
import type { WheelTheme } from '@/lib/wheel-themes';

type Props = {
    theme: WheelTheme;
    brand: ReactNode;
    children: ReactNode;
};

/**
 * Two-pane responsive layout for public wheel pages.
 *
 * - lg+: brand pane on the inline-start side (right under RTL, left under LTR),
 *   wheel pane fills the rest. Both panes vertically + horizontally centred.
 * - mobile: brand stacks ABOVE the wheel so the wheel is always the focus.
 */
export default function WheelPublicLayout({ theme, brand, children }: Props) {
    return (
        <div
            className="min-h-svh w-full font-sans"
            style={{ background: theme.background, color: theme.text }}
        >
            <div className="mx-auto grid min-h-svh w-full max-w-7xl lg:grid-cols-[minmax(320px,36%)_1fr]">
                <aside
                    className="order-first flex items-center justify-center border-b p-6 sm:p-10 lg:order-1 lg:border-b-0 lg:border-e"
                    style={{
                        background: theme.surface,
                        borderColor: theme.panel,
                    }}
                >
                    <div className="w-full max-w-sm">{brand}</div>
                </aside>
                <main className="relative flex min-h-[60svh] items-center justify-center overflow-hidden p-4 sm:p-8 lg:order-2 lg:min-h-svh">
                    <div className="flex w-full items-center justify-center">{children}</div>
                </main>
            </div>
        </div>
    );
}
