import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SettingsLayout from '@/layouts/settings/layout';
import UserForm from '@/components/Users/UserForm';
import { usersStore, usersIndex } from '@/routes';

interface Props {
    roles: { id: number; name: string }[];
}

export default function Create({ roles }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        roles: [] as number[],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(usersStore.url(), {
            onSuccess: () => router.get(usersIndex.url()),
        });
    };

    return (
        <SettingsLayout breadcrumbs={[
            { title: 'Utilisateurs', href: usersIndex.url() },
            { title: 'Nouvel utilisateur', href: usersCreate.url() }
        ]}>
            <Head title="Nouvel utilisateur" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Créer un utilisateur</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <UserForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            roles={roles}
                        />
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.get(usersIndex.url())}
                                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors disabled:opacity-40"
                            >
                                Créer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </SettingsLayout>
    );
}