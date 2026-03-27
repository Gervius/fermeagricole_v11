import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SettingsLayout from '@/layouts/settings/layout';
import UnitForm from '@/components/Units/UnitForm';
import { unitsCreate, unitsStore, unitsIndex } from '@/routes';

interface Props {
    baseUnits: { id: number; name: string; symbol: string }[];
}

export default function Create({ baseUnits }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        symbol: '',
        type: 'mass',
        base_unit_id: '',
        conversion_factor: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(unitsStore.url(), {
            onSuccess: () => router.get(unitsIndex.url()),
        });
    };

    return (
        <SettingsLayout breadcrumbs={[{ title: 'Nouvelle unité', href: unitsCreate.url() }]}>
            <Head title="Nouvelle unité" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Nouvelle unité de mesure</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <UnitForm
                            data={data}
                            setData={(key, value) => setData(key as any, value)}
                            errors={errors}
                            baseUnits={baseUnits}
                        />
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.get(unitsIndex.url())}
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