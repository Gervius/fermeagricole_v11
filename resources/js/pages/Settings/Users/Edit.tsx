import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SettingsLayout from '@/layouts/settings/layout';
import UserForm from '@/components/Users/UserForm';
import { usersUpdate, usersIndex } from '@/routes';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        roles: number[]; // IDs des rôles
    };
    roles: { id: number; name: string }[];
}

export default function Edit({ user, roles }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: user.roles,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(usersUpdate.url(user.id), {
            onSuccess: () => router.get(usersIndex.url()),
        });
    };

    return (
        <SettingsLayout breadcrumbs={[
            { title: 'Utilisateurs', href: usersIndex.url() },
            { title: 'Modifier', href: usersUpdate.url(user.id) }
        ]}>
            <Head title="Modifier utilisateur" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Modifier {user.name}</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <UserForm
                            data={data}
                            setData={setData}
                            errors={errors}
                            roles={roles}
                            isEditing
                        />
                        <p className="text-xs text-stone-500 italic">Laissez le mot de passe vide pour ne pas le changer.</p>
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
                                Mettre à jour
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </SettingsLayout>
    );
}