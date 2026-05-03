import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import WheelForm, { defaultWheelFormValues } from '@/components/admin/wheel-form';
import { dashboard } from '@/routes';
import wheels from '@/routes/admin/wheels';

export default function WheelsCreate() {
    return (
        <>
            <Head title="إنشاء عجلة" />
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading title="إنشاء عجلة" description="اضبط العناصر والمظهر ولوحة العلامة." />
                <WheelForm
                    initial={defaultWheelFormValues()}
                    submitUrl={wheels.store().url}
                    method="post"
                    submitLabel="إنشاء العجلة"
                />
            </div>
        </>
    );
}

WheelsCreate.layout = {
    breadcrumbs: [
        { title: 'لوحة التحكم', href: dashboard() },
        { title: 'العجلات', href: wheels.index() },
        { title: 'إنشاء', href: wheels.create() },
    ],
};
