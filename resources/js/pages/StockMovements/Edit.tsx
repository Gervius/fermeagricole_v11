import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import StockMovementForm from '@/components/StockMovements/StockMovementForm';
import { stockMovementsUpdate, stockMovementsIndex } from '@/routes';

interface Props {
    movement: {
        id: number;
        ingredient_id: number;
        type: 'in' | 'out' | 'adjust';
        quantity: number;
        unit_id: number;
        unit_price: number | null;
        reason: string | null;
        reference: string | null;
    };
    ingredients: { id: number; name: string }[];
    units: { id: number; name: string; symbol: string }[];
}

export default function Edit({ movement, ingredients, units }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        ingredient_id: movement.ingredient_id.toString(),
        type: movement.type,
        quantity: movement.quantity.toString(),
        unit_id: movement.unit_id.toString(),
        unit_price: movement.unit_price?.toString() || '',
        reason: movement.reason || '',
        reference: movement.reference || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(stockMovementsUpdate.url(movement.id), {
            onSuccess: () => router.get(stockMovementsIndex.url()),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Modifier mouvement', href: stockMovementsUpdate.url(movement.id) }]}>
            <Head title="Modifier mouvement" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Modifier le mouvement</h1>
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
                                Mettre à jour
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}