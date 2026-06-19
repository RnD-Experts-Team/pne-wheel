import { Head, Link, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import users from '@/routes/admin/users';

type UserRow = {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string | null;
};

export default function UsersIndex({ users: rows }: { users: UserRow[] }) {
    const handleDelete = (row: UserRow) => {
        if (!confirm(`Delete user "${row.name}"? This cannot be undone.`)) return;
        router.delete(users.destroy(row.id).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('User deleted'),
        });
    };

    return (
        <>
            <Head title="Users" />
            <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <Heading title="Users" description="Manage accounts that can access the admin panel." />
                    <Button asChild>
                        <Link href={users.create()}>
                            <Plus />
                            New User
                        </Link>
                    </Button>
                </div>

                {rows.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
                        <p className="text-sm text-muted-foreground">No users yet.</p>
                        <Button asChild>
                            <Link href={users.create()}>
                                <Plus />
                                Create first user
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-start font-medium">Name</th>
                                    <th className="px-4 py-3 text-start font-medium">Email</th>
                                    <th className="px-4 py-3 text-start font-medium">Status</th>
                                    <th className="px-4 py-3 text-start font-medium">Created</th>
                                    <th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rows.map((row) => (
                                    <tr key={row.id} className="hover:bg-muted/30">
                                        <td className="px-4 py-3 font-medium">{row.name}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                                        <td className="px-4 py-3">
                                            <Badge variant={row.email_verified_at ? 'default' : 'secondary'}>
                                                {row.email_verified_at ? 'Verified' : 'Unverified'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {row.created_at
                                                ? new Date(row.created_at).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end">
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

UsersIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Users', href: users.index() },
    ],
};
