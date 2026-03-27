import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SettingsLayout from '@/layouts/settings/layout';
import RoleForm from '@/components/Roles/RoleForm';
import { rolesUpdate, rolesIndex } from '@/routes';

interface Props {
    role: {
        id: number;
        name: string;
        permissions: number[]; // IDs des permissions
    };
    permissions: { id: number; name: string }[];
}

export default function Edit({ role, permissions }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        name: role.name,
        permissions: role.permissions,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(rolesUpdate.url(role.id), {
            onSuccess: () => router.get(rolesIndex.url()),
        });
    };

    return (
        <SettingsLayout breadcrumbs={[
            { title: 'Rôles', href: rolesIndex.url() },
            { title: 'Modifier', href: rolesUpdate.url(role.id) }
        ]}>
            <Head title="Modifier rôle" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Modifier le rôle {role.name}</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <RoleForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            permissions={permissions}
                        />
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.get(rolesIndex.url())}
                                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors disabled:opacity-40"
                            >
                                Mettre à jour
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </SettingsLayout>
    );
}