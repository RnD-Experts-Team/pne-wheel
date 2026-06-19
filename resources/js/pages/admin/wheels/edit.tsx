import { Head } from '@inertiajs/react';
import { ExternalLink } from 'lucide-react';
import Heading from '@/components/heading';
import WheelForm, { defaultCustomPalette, type WheelFormValues } from '@/components/admin/wheel-form';
import type { HubStyle, PegStyle, PointerStyle } from '@/components/prize-wheel';
import type { CustomPalette, WheelThemeKey } from '@/lib/wheel-themes';
import { dashboard } from '@/routes';
import wheels from '@/routes/admin/wheels';

type EditableWheelItem = {
    id: number;
    label: string;
    weight: number;
    position: number;
    image_path: string | null;
    image_url: string | null;
};

type EditableWheel = {
    id: number;
    slug: string;
    name: string;
    brand_name: string | null;
    brand_logo_path: string | null;
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
    is_published: boolean;
    public_url: string;
    items: EditableWheelItem[];
};

export default function WheelsEdit({ wheel }: { wheel: EditableWheel }) {
    const initial: WheelFormValues = {
        name: wheel.name,
        slug: wheel.slug,
        brand_name: wheel.brand_name ?? '',
        brand_logo: null,
        brand_logo_url: wheel.brand_logo_url,
        remove_brand_logo: false,
        address: wheel.address ?? '',
        theme: wheel.theme,
        brand_color: wheel.brand_color ?? '#3b82f6',
        custom_palette: {
            ...defaultCustomPalette(),
            ...(wheel.custom_palette ?? {}),
            sliceColors:
                wheel.custom_palette?.sliceColors && wheel.custom_palette.sliceColors.length >= 2
                    ? wheel.custom_palette.sliceColors
                    : defaultCustomPalette().sliceColors,
        },
        hub_style: wheel.hub_style,
        pointer_style: wheel.pointer_style,
        peg_style: wheel.peg_style,
        number_of_fields: wheel.number_of_fields ? String(wheel.number_of_fields) : '',
        sound_enabled: wheel.sound_enabled,
        confetti_enabled: wheel.confetti_enabled,
        is_published: wheel.is_published,
        items: wheel.items.map((i) => ({
            id: i.id,
            label: i.label,
            weight: i.weight,
            image: null,
            image_url: i.image_url,
            existing_image_path: i.image_path,
            remove_image: false,
        })),
    };

    return (
        <>
            <Head title={`Edit · ${wheel.name}`} />
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <Heading title={wheel.name} description="Edit items, appearance, and brand panel." />
                    <a
                        href={wheel.public_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        Open public page <ExternalLink className="size-3.5" />
                    </a>
                </div>

                <WheelForm
                    initial={initial}
                    submitUrl={wheels.update(wheel.slug).url}
                    method="put"
                    submitLabel="Save changes"
                    wheelSlug={wheel.slug}
                    canDelete
                />
            </div>
        </>
    );
}

WheelsEdit.layout = ({ wheel }: { wheel: EditableWheel }) => ({
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Wheels', href: wheels.index() },
        { title: wheel.name, href: wheels.edit(wheel.slug) },
    ],
});
