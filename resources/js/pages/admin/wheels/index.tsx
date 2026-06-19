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
        if (!confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
        router.delete(wheels.destroy(row.slug).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Wheel deleted'),
        });
    };

    return (
        <>
            <Head title="Wheels" />
            <div className="mx-auto flex h-full w-full max-w-6xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <Heading title="Wheels" description="Create and manage your public reward wheels." />
                    <Button asChild>
                        <Link href={wheels.create()}>
                            <Plus />
                            New Wheel
                        </Link>
                    </Button>
                </div>

                {rows.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
                        <p className="text-sm text-muted-foreground">
                            You haven't created any wheels yet.
                        </p>
                        <Button asChild>
                            <Link href={wheels.create()}>
                                <Plus />
                                Create your first wheel
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-start text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-start font-medium">Name</th>
                                    <th className="px-4 py-3 text-start font-medium">Theme</th>
                                    <th className="px-4 py-3 text-start font-medium">Items</th>
                                    <th className="px-4 py-3 text-start font-medium">Status</th>
                                    <th className="px-4 py-3 text-start font-medium">Public URL</th>
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
                                                {row.is_published ? 'Published' : 'Draft'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={row.public_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
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
                                                        toast.success('Link copied');
                                                    }}
                                                    title="Copy link"
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
        { title: 'Dashboard', href: dashboard() },
        { title: 'Wheels', href: wheels.index() },
    ],
};
