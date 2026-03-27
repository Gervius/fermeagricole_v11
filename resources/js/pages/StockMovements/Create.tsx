import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import StockMovementForm from '@/components/StockMovements/StockMovementForm';
import { stockMovementsCreate,stockMovementsStore, stockMovementsIndex } from '@/routes';

interface Props {
    ingredients: { id: number; name: string }[];
    units: { id: number; name: string; symbol: string }[];
}

export default function Create({ ingredients, units }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        ingredient_id: '',
        type: 'in',
        quantity: '',
        unit_id: '',
        unit_price: '',
        reason: '',
        reference: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(stockMovementsStore.url(), {
            onSuccess: () => router.get(stockMovementsIndex.url()),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Nouveau mouvement', href: stockMovementsCreate.url() }]}>
            <Head title="Nouveau mouvement de stock" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Nouveau mouvement de stock</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <StockMovementForm
                            data={data}
                            setData={(key, value) => setData(key as any, value)}
                            errors={errors}
                            ingredients={ingredients}
                            units={units}
                        />
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.get(stockMovementsIndex.url())}
                                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors disabled:opacity-40"
                            >
                                Enregistrer (brouillon)
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}