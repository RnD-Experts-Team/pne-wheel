import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import WheelForm, { defaultWheelFormValues } from '@/components/admin/wheel-form';
import { dashboard } from '@/routes';
import wheels from '@/routes/admin/wheels';

export default function WheelsCreate() {
    return (
        <>
            <Head title="Create Wheel" />
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-6">
                <Heading title="Create Wheel" description="Set up items, appearance, and brand panel." />
                <WheelForm
                    initial={defaultWheelFormValues()}
                    submitUrl={wheels.store().url}
                    method="post"
                    submitLabel="Create Wheel"
                />
            </div>
        </>
    );
}

WheelsCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Wheels', href: wheels.index() },
        { title: 'Create', href: wheels.create() },
    ],
};
