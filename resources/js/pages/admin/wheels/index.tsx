import { Head, Link, router } from '@inertiajs/react';
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClipboard } from '@/hooks/use-clipboard';
import { dashboard } from '@/routes';
import wheels from '@/routes/admin/wheels';

type WheelRow = {
    id: number;
    slug: string;
    name: string;
    theme: string;
    is_published: boolean;
    items_count: number;
    public_url: string;
    edit_url: string;
    updated_at: string | null;
};

export default function WheelsIndex({ wheels: rows }: { wheels: WheelRow[] }) {
    const [, copy] = useClipboard();

    const handleDelete = (row: WheelRow) => {
        if (!confirm(`هل تريد حذف "${row.name}"؟ لا يمكن التراجع.`)) return;
        router.delete(wheels.destroy(row.slug).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('تم حذف العجلة'),
        });
    };

    return (
        <>
            <Head title="العجلات" />
            <div className="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <Heading title="العجلات" description="أنشئ وأدر عجلات الجوائز العامة." />
                    <Button asChild>
                        <Link href={wheels.create()}>
                            <Plus />
                            عجلة جديدة
                        </Link>
                    </Button>
                </div>

                {rows.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
                        <p className="text-sm text-muted-foreground">
                            لم تنشئ أي عجلة بعد.
                        </p>
                        <Button asChild>
                            <Link href={wheels.create()}>
                                <Plus />
                                أنشئ عجلتك الأولى
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-start text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-start font-medium">الاسم</th>
                                    <th className="px-4 py-3 text-start font-medium">المظهر</th>
                                    <th className="px-4 py-3 text-start font-medium">العناصر</th>
                                    <th className="px-4 py-3 text-start font-medium">الحالة</th>
                                    <th className="px-4 py-3 text-start font-medium">الرابط العام</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{row.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{row.theme}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {row.items_count}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={row.is_published ? 'default' : 'secondary'}>
                                                {row.is_published ? 'منشورة' : 'مسودة'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={row.public_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                                    dir="ltr"
                                                >
                                                    /w/{row.slug}
                                                    <ExternalLink className="size-3" />
                                                </a>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7"
                                                    onClick={() => {
                                                        copy(row.public_url);
                                                        toast.success('تم نسخ الرابط');
                                                    }}
                                                    title="نسخ الرابط"
                                                >
                                                    <Copy className="size-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button asChild variant="ghost" size="icon" className="size-8">
                                                    <Link href={row.edit_url}>
                                                        <Pencil />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-destructive"
                                                    onClick={() => handleDelete(row)}
                                                >
                                                    <Trash2 />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

WheelsIndex.layout = {
    breadcrumbs: [
        { title: 'لوحة التحكم', href: dashboard() },
        { title: 'العجلات', href: wheels.index() },
    ],
};
