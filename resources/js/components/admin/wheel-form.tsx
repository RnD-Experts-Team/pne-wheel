import { router, useForm } from '@inertiajs/react';
import { GripVertical, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useMemo, useRef } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { HubStyle, PegStyle, PointerStyle } from '@/components/prize-wheel';
import { WHEEL_THEMES, type CustomPalette, type WheelThemeKey } from '@/lib/wheel-themes';
import wheels from '@/routes/admin/wheels';

export type WheelItemFormValue = {
    id?: number | null;
    label: string;
    weight: number;
    image?: File | null;
    image_url?: string | null;
    remove_image?: boolean;
    existing_image_path?: string | null;
};

export type WheelFormValues = {
    name: string;
    slug: string;
    brand_name: string;
    brand_logo?: File | null;
    brand_logo_url?: string | null;
    remove_brand_logo: boolean;
    address: string;
    theme: WheelThemeKey;
    brand_color: string;
    custom_palette: Required<Pick<CustomPalette, 'accent' | 'rim' | 'pointer' | 'textColor' | 'background' | 'surface'>> & {
        sliceColors: string[];
    };
    hub_style: HubStyle;
    pointer_style: PointerStyle;
    peg_style: PegStyle;
    number_of_fields: string;
    sound_enabled: boolean;
    confetti_enabled: boolean;
    is_published: boolean;
    items: WheelItemFormValue[];
};

const DEFAULT_ITEMS: WheelItemFormValue[] = [
    { label: 'خصم 10٪', weight: 1 },
    { label: 'مشروب مجاني', weight: 1 },
    { label: 'حاول مرة أخرى', weight: 3 },
    { label: 'قسيمة 5 ر.س', weight: 1 },
    { label: 'هدية غامضة', weight: 1 },
    { label: 'شكراً لك', weight: 3 },
];

export function defaultCustomPalette() {
    return {
        accent: '#22d3ee',
        rim: '#1e293b',
        pointer: '#22d3ee',
        textColor: '#fafafa',
        background: '#0a0a0b',
        surface: '#111114',
        sliceColors: ['#0e7490', '#0f172a', '#06b6d4', '#0f172a'],
    };
}

export function defaultWheelFormValues(): WheelFormValues {
    return {
        name: '',
        slug: '',
        brand_name: '',
        brand_logo: null,
        brand_logo_url: null,
        remove_brand_logo: false,
        address: '',
        theme: 'dark',
        brand_color: '#3b82f6',
        custom_palette: defaultCustomPalette(),
        hub_style: 'classic',
        pointer_style: 'classic',
        peg_style: 'dots',
        number_of_fields: '',
        sound_enabled: true,
        confetti_enabled: true,
        is_published: false,
        items: DEFAULT_ITEMS.map((i) => ({ ...i })),
    };
}

const HUB_OPTIONS: { value: HubStyle; label: string }[] = [
    { value: 'classic', label: 'كلاسيكي' },
    { value: 'minimal', label: 'بسيط' },
    { value: 'logo', label: 'الشعار' },
    { value: 'starburst', label: 'انفجار نجمي' },
];

const POINTER_OPTIONS: { value: PointerStyle; label: string }[] = [
    { value: 'classic', label: 'كلاسيكي' },
    { value: 'arrow', label: 'سهم' },
    { value: 'flag', label: 'علم' },
    { value: 'triangle', label: 'مثلث' },
    { value: 'pin', label: 'دبوس' },
    { value: 'ball', label: 'كرة' },
    { value: 'diamond', label: 'ماسة' },
    { value: 'needle', label: 'إبرة' },
    { value: 'spear', label: 'رمح' },
    { value: 'crown', label: 'تاج' },
];

const PEG_OPTIONS: { value: PegStyle; label: string }[] = [
    { value: 'dots', label: 'نقاط' },
    { value: 'lights', label: 'أضواء متناوبة' },
    { value: 'none', label: 'بدون' },
];

type Props = {
    initial: WheelFormValues;
    submitUrl: string;
    method: 'post' | 'put';
    submitLabel: string;
    wheelSlug?: string;
    canDelete?: boolean;
};

export default function WheelForm({ initial, submitUrl, method, submitLabel, wheelSlug, canDelete }: Props) {
    const form = useForm<WheelFormValues>(initial);
    const { data, setData, errors, processing } = form;
    const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

    const themeOptions = useMemo(
        () =>
            Object.values(WHEEL_THEMES).map((t) => ({
                value: t.key,
                label: t.labelAr,
            })),
        [],
    );

    const updateItem = (index: number, patch: Partial<WheelItemFormValue>) => {
        const next = data.items.map((it, i) => (i === index ? { ...it, ...patch } : it));
        setData('items', next);
    };

    const addItem = () => {
        if (data.items.length >= 24) return;
        setData('items', [...data.items, { label: '', weight: 1 }]);
    };

    const removeItem = (index: number) => {
        if (data.items.length <= 2) return;
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    };

    const moveItem = (index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= data.items.length) return;
        const next = [...data.items];
        [next[index], next[target]] = [next[target], next[index]];
        setData('items', next);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const transform = (payload: WheelFormValues): Record<string, unknown> => {
            const out: Record<string, unknown> = {
                _method: method === 'put' ? 'PUT' : undefined,
                name: payload.name,
                slug: payload.slug || '',
                brand_name: payload.brand_name || '',
                address: payload.address || '',
                theme: payload.theme,
                brand_color: payload.theme === 'brand' ? payload.brand_color : '',
                hub_style: payload.hub_style,
            };
            if (payload.theme === 'custom') {
                out['custom_palette[accent]'] = payload.custom_palette.accent;
                out['custom_palette[rim]'] = payload.custom_palette.rim;
                out['custom_palette[pointer]'] = payload.custom_palette.pointer;
                out['custom_palette[textColor]'] = payload.custom_palette.textColor;
                out['custom_palette[background]'] = payload.custom_palette.background;
                out['custom_palette[surface]'] = payload.custom_palette.surface;
                payload.custom_palette.sliceColors.forEach((c, i) => {
                    out[`custom_palette[sliceColors][${i}]`] = c;
                });
            }
            Object.assign(out, {
                pointer_style: payload.pointer_style,
                peg_style: payload.peg_style,
                number_of_fields: payload.number_of_fields || '',
                sound_enabled: payload.sound_enabled ? 1 : 0,
                confetti_enabled: payload.confetti_enabled ? 1 : 0,
                is_published: payload.is_published ? 1 : 0,
                remove_brand_logo: payload.remove_brand_logo ? 1 : 0,
            });
            if (payload.brand_logo instanceof File) {
                out.brand_logo = payload.brand_logo;
            }
            payload.items.forEach((item, idx) => {
                if (item.id) out[`items[${idx}][id]`] = item.id;
                out[`items[${idx}][label]`] = item.label;
                out[`items[${idx}][weight]`] = item.weight;
                if (item.image instanceof File) out[`items[${idx}][image]`] = item.image;
                if (item.remove_image) out[`items[${idx}][remove_image]`] = 1;
            });
            Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
            return out;
        };

        router.post(submitUrl, transform(data) as never, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                form.clearErrors();
                toast.success(method === 'put' ? 'تم حفظ التغييرات بنجاح.' : 'تم إنشاء العجلة بنجاح.');
            },
            onError: (serverErrors) => {
                form.setError(serverErrors as never);
                const firstError = Object.values(serverErrors)
                    .map((value) => (Array.isArray(value) ? value[0] : value))
                    .find((value): value is string => typeof value === 'string' && value.length > 0);

                toast.error(firstError ?? 'تعذر حفظ التغييرات. يرجى مراجعة أخطاء النموذج.');
            },
        });
    };

    const handleDelete = () => {
        if (!wheelSlug) return;
        if (!confirm('هل تريد حذف هذه العجلة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
        router.delete(wheels.destroy(wheelSlug).url, { preserveScroll: false });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-10">
            {/* أساسيات العجلة */}
            <section className="space-y-6">
                <header className="space-y-1">
                    <h2 className="text-base font-semibold tracking-tight">أساسيات العجلة</h2>
                    <p className="text-sm text-muted-foreground">الاسم، رابط الـURL العام، وحالة النشر.</p>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="name">الاسم</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="عجلة عرض الربيع"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="slug">رابط الـURL العام (اختياري)</Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value.toLowerCase())}
                            placeholder="spring-promo"
                            pattern="[a-z0-9\-]*"
                            dir="ltr"
                        />
                        <p className="text-xs text-muted-foreground">
                            يُولَّد تلقائياً من الاسم إذا تُرك فارغاً. أحرف لاتينية صغيرة، أرقام وشرطات فقط.
                        </p>
                        <InputError message={errors.slug} />
                    </div>
                </div>

                <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                        checked={data.is_published}
                        onCheckedChange={(c) => setData('is_published', c === true)}
                    />
                    <span>نشر — اجعل هذه العجلة قابلة للوصول من رابطها العام</span>
                </label>
            </section>

            <Separator />

            {/* لوحة العلامة التجارية */}
            <section className="space-y-6">
                <header className="space-y-1">
                    <h2 className="text-base font-semibold tracking-tight">لوحة العلامة التجارية</h2>
                    <p className="text-sm text-muted-foreground">تظهر بجانب العجلة في الصفحة العامة.</p>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label htmlFor="brand_name">اسم العلامة التجارية</Label>
                        <Input
                            id="brand_name"
                            value={data.brand_name}
                            onChange={(e) => setData('brand_name', e.target.value)}
                            placeholder="كول مي للقهوة"
                        />
                        <InputError message={errors.brand_name} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">العنوان / الشعار</Label>
                        <Input
                            id="address"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            placeholder="طريق قنوات"
                        />
                        <InputError message={errors.address} />
                    </div>
                </div>

                <div className="grid gap-3">
                    <Label>شعار العلامة (PNG أو SVG، حد أقصى 512 كيلوبايت)</Label>
                    <div className="flex items-start gap-4">
                        {(data.brand_logo instanceof File || data.brand_logo_url) && !data.remove_brand_logo && (
                            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted">
                                <img
                                    src={
                                        data.brand_logo instanceof File
                                            ? URL.createObjectURL(data.brand_logo)
                                            : (data.brand_logo_url ?? '')
                                    }
                                    alt="شعار العلامة"
                                    className="max-h-full max-w-full"
                                />
                            </div>
                        )}
                        <div className="flex flex-col gap-2">
                            <Input
                                id="brand_logo"
                                type="file"
                                accept="image/png,image/svg+xml"
                                onChange={(e) =>
                                    setData('brand_logo', e.target.files?.[0] ?? null)
                                }
                            />
                            {data.brand_logo_url && !data.remove_brand_logo && (
                                <button
                                    type="button"
                                    className="self-start text-xs text-destructive underline-offset-4 hover:underline"
                                    onClick={() => {
                                        setData('brand_logo', null);
                                        setData('remove_brand_logo', true);
                                    }}
                                >
                                    إزالة الشعار الحالي
                                </button>
                            )}
                        </div>
                    </div>
                    <InputError message={errors.brand_logo} />
                </div>
            </section>

            <Separator />

            {/* المظهر والسلوك */}
            <section className="space-y-6">
                <header className="space-y-1">
                    <h2 className="text-base font-semibold tracking-tight">المظهر والسلوك</h2>
                    <p className="text-sm text-muted-foreground">المظهر، نمط المحور، المؤشر، الأضواء، الصوت، والكونفيتي.</p>
                </header>

                <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                        <Label>المظهر</Label>
                        <Select value={data.theme} onValueChange={(v) => setData('theme', v as WheelThemeKey)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {themeOptions.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.theme} />
                    </div>

                    {data.theme === 'brand' && (
                        <div className="grid gap-2">
                            <Label htmlFor="brand_color">لون العلامة</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="brand_color"
                                    type="color"
                                    value={data.brand_color}
                                    onChange={(e) => setData('brand_color', e.target.value)}
                                    className="h-9 w-12 cursor-pointer rounded-md border bg-transparent"
                                />
                                <Input
                                    value={data.brand_color}
                                    onChange={(e) => setData('brand_color', e.target.value)}
                                    placeholder="#3b82f6"
                                    pattern="#[0-9a-fA-F]{6}"
                                    dir="ltr"
                                />
                            </div>
                            <InputError message={errors.brand_color} />
                        </div>
                    )}
                </div>

                {data.theme === 'custom' && (
                    <div className="rounded-lg border bg-card/40 p-4">
                        <header className="mb-4 space-y-1">
                            <h3 className="text-sm font-semibold">لوحة الألوان المخصصة</h3>
                            <p className="text-xs text-muted-foreground">
                                اختر ألوان العجلة بدقة. اللون الأساسي يستخدم للزر، الإطار للحلقة الخارجية، والمؤشر للسهم.
                            </p>
                        </header>

                        <div className="grid gap-3 md:grid-cols-3">
                            {([
                                ['accent', 'اللون الأساسي'],
                                ['rim', 'لون الإطار'],
                                ['pointer', 'لون المؤشر'],
                                ['textColor', 'لون النص'],
                                ['background', 'الخلفية'],
                                ['surface', 'لون اللوحة'],
                            ] as const).map(([key, label]) => (
                                <label key={key} className="flex items-center gap-2 text-xs">
                                    <input
                                        type="color"
                                        value={data.custom_palette[key]}
                                        onChange={(e) =>
                                            setData('custom_palette', {
                                                ...data.custom_palette,
                                                [key]: e.target.value,
                                            })
                                        }
                                        className="h-9 w-9 cursor-pointer rounded-md border bg-transparent"
                                    />
                                    <span className="flex-1">{label}</span>
                                    <span
                                        className="font-mono text-[10px] text-muted-foreground"
                                        dir="ltr"
                                    >
                                        {data.custom_palette[key]}
                                    </span>
                                </label>
                            ))}
                        </div>

                        <div className="mt-4 space-y-2">
                            <p className="text-xs font-medium">ألوان القطاعات</p>
                            <div className="flex flex-wrap gap-2">
                                {data.custom_palette.sliceColors.map((c, i) => (
                                    <div key={i} className="flex items-center gap-1 rounded-md border p-1">
                                        <input
                                            type="color"
                                            value={c}
                                            onChange={(e) => {
                                                const next = [...data.custom_palette.sliceColors];
                                                next[i] = e.target.value;
                                                setData('custom_palette', {
                                                    ...data.custom_palette,
                                                    sliceColors: next,
                                                });
                                            }}
                                            className="h-7 w-7 cursor-pointer rounded bg-transparent"
                                        />
                                        {data.custom_palette.sliceColors.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = data.custom_palette.sliceColors.filter(
                                                        (_, j) => j !== i,
                                                    );
                                                    setData('custom_palette', {
                                                        ...data.custom_palette,
                                                        sliceColors: next,
                                                    });
                                                }}
                                                className="text-[10px] text-muted-foreground hover:text-destructive"
                                                aria-label="حذف اللون"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {data.custom_palette.sliceColors.length < 8 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData('custom_palette', {
                                                ...data.custom_palette,
                                                sliceColors: [...data.custom_palette.sliceColors, '#888888'],
                                            })
                                        }
                                        className="rounded-md border border-dashed px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                                    >
                                        + إضافة لون
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="grid gap-2">
                        <Label>نمط المحور المركزي</Label>
                        <Select
                            value={data.hub_style}
                            onValueChange={(v) => setData('hub_style', v as HubStyle)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {HUB_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.hub_style} />
                    </div>

                    <div className="grid gap-2 md:col-span-2">
                        <Label>نمط المؤشر (واجهة بصرية من لوحة التحكم)</Label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
                            {POINTER_OPTIONS.map((o) => {
                                const selected = data.pointer_style === o.value;
                                return (
                                    <button
                                        key={o.value}
                                        type="button"
                                        onClick={() => setData('pointer_style', o.value)}
                                        className={`flex flex-col items-center gap-2 rounded-lg border p-2 text-xs transition ${
                                            selected
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-border bg-background hover:bg-muted/40'
                                        }`}
                                        aria-pressed={selected}
                                    >
                                        <span className="relative flex h-14 w-10 items-end justify-center rounded-md border border-border/70 bg-muted/20">
                                            {(o.value === 'classic' || o.value === 'arrow' || o.value === 'spear') && (
                                                <>
                                                    <span className="absolute bottom-1 h-8 w-1 rounded-full bg-zinc-500" />
                                                    <span className={`absolute top-1 ${o.value === 'arrow' ? 'h-0 w-0 border-r-[7px] border-l-[7px] border-b-[14px] border-r-transparent border-l-transparent border-b-amber-300' : o.value === 'spear' ? 'h-0 w-0 border-r-[6px] border-l-[6px] border-b-[16px] border-r-transparent border-l-transparent border-b-sky-300' : 'h-0 w-0 border-r-[8px] border-l-[8px] border-b-[12px] border-r-transparent border-l-transparent border-b-zinc-300'}`} />
                                                </>
                                            )}
                                            {o.value === 'flag' && (
                                                <>
                                                    <span className="absolute bottom-1 h-9 w-1 rounded-full bg-zinc-500" />
                                                    <span className="absolute top-3 left-5 h-0 w-0 border-t-[5px] border-b-[5px] border-l-[12px] border-t-transparent border-b-transparent border-l-amber-300" />
                                                </>
                                            )}
                                            {o.value === 'triangle' && (
                                                <span className="absolute top-2 h-0 w-0 border-r-[9px] border-l-[9px] border-b-[20px] border-r-transparent border-l-transparent border-b-zinc-200" />
                                            )}
                                            {o.value === 'pin' && (
                                                <>
                                                    <span className="absolute bottom-1 h-8 w-1 rounded-full bg-zinc-500" />
                                                    <span className="absolute top-2 h-3 w-3 rounded-full border border-zinc-500 bg-rose-300" />
                                                </>
                                            )}
                                            {o.value === 'ball' && (
                                                <>
                                                    <span className="absolute bottom-1 h-8 w-1 rounded-full bg-zinc-500" />
                                                    <span className="absolute top-2 h-4 w-4 rounded-full border border-zinc-500 bg-sky-300" />
                                                </>
                                            )}
                                            {o.value === 'diamond' && (
                                                <span className="absolute top-2 h-0 w-0 border-t-[10px] border-r-[8px] border-b-[10px] border-l-[8px] border-t-transparent border-r-cyan-300 border-b-transparent border-l-cyan-300" />
                                            )}
                                            {o.value === 'needle' && (
                                                <>
                                                    <span className="absolute bottom-1 h-8 w-[2px] rounded-full bg-zinc-500" />
                                                    <span className="absolute top-1 h-0 w-0 border-r-[4px] border-l-[4px] border-b-[16px] border-r-transparent border-l-transparent border-b-zinc-200" />
                                                </>
                                            )}
                                            {o.value === 'crown' && (
                                                <>
                                                    <span className="absolute bottom-1 h-7 w-[2px] rounded-full bg-zinc-500" />
                                                    <span className="absolute top-2 h-3 w-5 rounded-sm border border-amber-400 bg-amber-300/70" />
                                                    <span className="absolute top-0 text-[10px] leading-none text-amber-400">▲ ▲</span>
                                                </>
                                            )}
                                        </span>
                                        <span className="font-medium">{o.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <InputError message={errors.pointer_style} />
                    </div>

                    <div className="grid gap-2">
                        <Label>أضواء الحافة</Label>
                        <Select
                            value={data.peg_style}
                            onValueChange={(v) => setData('peg_style', v as PegStyle)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PEG_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>
                                        {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.peg_style} />
                    </div>
                </div>

                <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-3 text-sm">
                        <Checkbox
                            checked={data.sound_enabled}
                            onCheckedChange={(c) => setData('sound_enabled', c === true)}
                        />
                        <span>المؤثرات الصوتية (نقرات + موسيقى الفوز)</span>
                    </label>
                    <label className="flex items-center gap-3 text-sm">
                        <Checkbox
                            checked={data.confetti_enabled}
                            onCheckedChange={(c) => setData('confetti_enabled', c === true)}
                        />
                        <span>كونفيتي عند الفوز</span>
                    </label>
                </div>
            </section>

            <Separator />

            {/* عناصر العجلة */}
            <section className="space-y-6">
                <header className="space-y-1">
                    <h2 className="text-base font-semibold tracking-tight">عناصر العجلة</h2>
                    <p className="text-sm text-muted-foreground">
                        كل عنصر يمثل قطاعاً. الوزن الأعلى = فرصة فوز أكبر. الصورة الصغيرة (PNG أو SVG ≤ 512 كيلوبايت) تظهر داخل القطاع.
                    </p>
                </header>

                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                    <div className="grid gap-2">
                        <Label htmlFor="number_of_fields">عدد القطاعات الظاهرة (اختياري)</Label>
                        <Input
                            id="number_of_fields"
                            type="number"
                            min={2}
                            max={24}
                            value={data.number_of_fields}
                            onChange={(e) => setData('number_of_fields', e.target.value)}
                            placeholder={`${data.items.length}`}
                            dir="ltr"
                        />
                        <p className="text-xs text-muted-foreground">
                            اتركه فارغاً ليُرسم قطاع واحد لكل عنصر. إذا كان أكبر، تتكرر العناصر لملء العجلة.
                        </p>
                        <InputError message={errors.number_of_fields} />
                    </div>
                </div>

                <div className="space-y-3">
                    {data.items.map((item, index) => {
                        const previewUrl =
                            item.image instanceof File
                                ? URL.createObjectURL(item.image)
                                : !item.remove_image
                                  ? (item.image_url ?? null)
                                  : null;
                        return (
                            <div
                                key={index}
                                className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-[auto_1fr_120px_auto_auto] md:items-center"
                            >
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => moveItem(index, -1)}
                                        disabled={index === 0}
                                        className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                        aria-label="نقل لأعلى"
                                    >
                                        <GripVertical className="size-4" />
                                    </button>
                                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                                </div>

                                <div className="grid gap-1">
                                    <Input
                                        value={item.label}
                                        onChange={(e) => updateItem(index, { label: e.target.value })}
                                        placeholder={`اسم العنصر ${index + 1}`}
                                        required
                                    />
                                    <InputError message={errors[`items.${index}.label` as keyof typeof errors]} />
                                </div>

                                <div className="grid gap-1">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={100}
                                        value={item.weight}
                                        onChange={(e) =>
                                            updateItem(index, { weight: Number(e.target.value) || 1 })
                                        }
                                        placeholder="الوزن"
                                        title="وزن احتمالية الفوز"
                                        dir="ltr"
                                    />
                                    <InputError message={errors[`items.${index}.weight` as keyof typeof errors]} />
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        ref={(el) => {
                                            fileInputs.current[index] = el;
                                        }}
                                        type="file"
                                        accept="image/png,image/svg+xml"
                                        className="hidden"
                                        onChange={(e) =>
                                            updateItem(index, {
                                                image: e.target.files?.[0] ?? null,
                                                remove_image: false,
                                            })
                                        }
                                    />
                                    {previewUrl ? (
                                        <button
                                            type="button"
                                            onClick={() => fileInputs.current[index]?.click()}
                                            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-muted"
                                            title="استبدال الصورة"
                                        >
                                            <img
                                                src={previewUrl}
                                                alt=""
                                                className="max-h-full max-w-full"
                                            />
                                        </button>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => fileInputs.current[index]?.click()}
                                            title="إضافة صورة"
                                        >
                                            <ImagePlus />
                                        </Button>
                                    )}
                                    {previewUrl && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                updateItem(index, {
                                                    image: null,
                                                    remove_image: true,
                                                })
                                            }
                                            className="text-xs text-destructive underline-offset-4 hover:underline"
                                        >
                                            إزالة
                                        </button>
                                    )}
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    disabled={data.items.length <= 2}
                                    onClick={() => removeItem(index)}
                                    title="حذف العنصر"
                                >
                                    <Trash2 />
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {typeof errors.items === 'string' && <InputError message={errors.items} />}

                <Button
                    type="button"
                    variant="outline"
                    onClick={addItem}
                    disabled={data.items.length >= 24}
                >
                    <Plus />
                    إضافة عنصر
                </Button>
            </section>

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="submit" disabled={processing}>
                    {submitLabel}
                </Button>
                {canDelete && wheelSlug && (
                    <Button type="button" variant="destructive" onClick={handleDelete}>
                        حذف العجلة
                    </Button>
                )}
            </div>
        </form>
    );
}
