import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Wheel = {
    id: number;
    slug: string;
    name: string;
    brand_name: string;
    address: string | null;
    theme: string;
    is_published: boolean;
    items_count: number;
    edit_url: string;
};

type DashboardProps = {
    wheels: Wheel[];
};

export default function Dashboard({ wheels }: DashboardProps) {
    const { auth } = usePage().props;

    if (!auth.user) {
        return null;
    }

    return (
        <>
            <Head title="Dashboard" />
            <div className="min-h-svh bg-gradient-to-b from-neutral-950 to-neutral-900 px-4 py-12 text-neutral-100 sm:px-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-12 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                                Your Wheels
                            </h1>
                            <p className="mt-2 text-neutral-400">
                                Manage your reward wheels
                            </p>
                        </div>
                        <Link href="/admin/wheels/create">
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                New Wheel
                            </Button>
                        </Link>
                    </div>

                    {/* Wheels Grid */}
                    {wheels.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-900/50 p-12 text-center backdrop-blur">
                            <p className="mb-6 text-neutral-400">You haven't created any wheels yet</p>
                            <Link href="/admin/wheels/create">
                                <Button variant="outline">
                                    Create your first wheel
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {wheels.map((wheel) => (
                                <Link
                                    key={wheel.id}
                                    href={wheel.edit_url}
                                    className="group block"
                                >
                                    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 transition-all duration-300 hover:border-neutral-700 hover:shadow-lg hover:shadow-amber-500/20">
                                        {/* Preview Area */}
                                        <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 p-6">
                                            <div className="text-center">
                                                <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800">
                                                    <span className="text-lg font-bold text-amber-400">
                                                        {wheel.items_count}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-neutral-500">
                                                    {wheel.items_count === 1 ? 'prize' : 'prizes'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Info Area */}
                                        <div className="border-t border-neutral-800 p-4">
                                            <h3 className="line-clamp-1 font-semibold text-white">
                                                {wheel.name}
                                            </h3>
                                            {wheel.brand_name && (
                                                <p className="mt-1 line-clamp-1 text-xs text-neutral-400">
                                                    {wheel.brand_name}
                                                </p>
                                            )}
                                            <div className="mt-3 flex items-center justify-between">
                                                {wheel.address && (
                                                    <p className="line-clamp-1 text-[10px] text-neutral-500">
                                                        {wheel.address}
                                                    </p>
                                                )}
                                                <span
                                                    className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                                                        wheel.is_published
                                                            ? 'bg-green-500/20 text-green-400'
                                                            : 'bg-neutral-800 text-neutral-400'
                                                    }`}
                                                >
                                                    {wheel.is_published ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
