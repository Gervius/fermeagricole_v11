import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ProductionForm from '@/components/FeedProductions/ProductionForm';
import { feedProductionsUpdate, feedProductionsIndex } from '@/routes';

interface Props {
    production: {
        id: number;
        recipe_id: number;
        production_date: string;
        quantity: number;
        notes: string | null;
    };
    recipes: { id: number; name: string; yield_unit: string }[];
}

export default function Edit({ production, recipes }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        recipe_id: production.recipe_id.toString(),
        production_date: production.production_date,
        quantity: production.quantity.toString(),
        notes: production.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(feedProductionsUpdate.url(production.id), {
            onSuccess: () => router.get(feedProductionsIndex.url()),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Modifier production', href: feedProductionsUpdate.url(production.id) }]}>
            <Head title="Modifier production" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Modifier la production</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <ProductionForm
                            data={data}
                            setData={(key, value) => setData(key as any, value)}
                            errors={errors}
                            recipes={recipes}
                        />
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.get(feedProductionsIndex.url())}
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
        </AppLayout>
    );
}