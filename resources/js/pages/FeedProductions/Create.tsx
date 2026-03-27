import React, { useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import ProductionForm from '@/components/FeedProductions/ProductionForm';
import { feedProductionsStore, feedProductionsIndex } from '@/routes';

interface RecipeIngredient {
    id: number;
    name: string;
    current_stock: number;
    default_unit: { symbol: string };
    pivot: {
        quantity: number;
        unit_id: number;
    };
}

interface Recipe {
    id: number;
    name: string;
    yield: number;
    unit: { symbol: string };
    ingredients: RecipeIngredient[];
}

interface Props {
    recipes: Recipe[];
}

export default function Create({ recipes }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        recipe_id: '',
        production_date: new Date().toISOString().split('T')[0],
        quantity: '',
        notes: '',
    });

    // 1. On trouve la recette sélectionnée
    const selectedRecipe = useMemo(() => {
        return recipes.find(r => r.id.toString() === data.recipe_id);
    }, [data.recipe_id, recipes]);

    // 2. Le fameux useMemo qui calcule tout en TEMPS RÉEL (Front-end pur)
    const ingredientDetails = useMemo(() => {
        if (!selectedRecipe || !data.quantity || isNaN(Number(data.quantity))) return [];

        const productionQty = Number(data.quantity);
        // On calcule le facteur multiplicateur en fonction du rendement de base de la recette
        const factor = productionQty / selectedRecipe.yield;

        return selectedRecipe.ingredients.map(ing => {
            const neededQty = ing.pivot.quantity * factor;
            return {
                id: ing.id,
                name: ing.name,
                needed: neededQty,
                current_stock: ing.current_stock,
                unit: ing.default_unit?.symbol || 'kg',
                hasEnough: ing.current_stock >= neededQty
            };
        });
    }, [selectedRecipe, data.quantity]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(feedProductionsStore.url(), {
            onSuccess: () => router.get(feedProductionsIndex.url())
        });
    };

    // Adaptation pour le sous-composant existant
    const simplifiedRecipes = recipes.map(r => ({
        id: r.id,
        name: r.name,
        yield_unit: r.unit?.symbol || ''
    }));

    return (
        <AppLayout breadcrumbs={[{ title: 'Nouvelle production', href: '#' }]}>
            <Head title="Nouvelle production" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Nouvelle production d'aliments</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        <ProductionForm
                            data={data}
                            setData={(key, value) => setData(key as any, value)}
                            errors={errors}
                            recipes={simplifiedRecipes}
                        />

                        {/* Affichage Dynamique du Calculateur */}
                        {selectedRecipe && data.quantity && Number(data.quantity) > 0 && (
                            <div className="mt-6 border border-stone-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                <div className="bg-stone-50 px-4 py-3 border-b border-stone-200">
                                    <h3 className="text-sm font-semibold text-stone-800">
                                        Impact sur les stocks ({selectedRecipe.name})
                                    </h3>
                                </div>
                                <div className="p-0">
                                    <table className="w-full text-sm">
                                        <thead className="bg-stone-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-stone-500 uppercase">Ingrédient</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-stone-500 uppercase">Requis</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-stone-500 uppercase">Stock Actuel</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-stone-500 uppercase">Statut</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {ingredientDetails.map((ing) => (
                                                <tr key={ing.id} className={ing.hasEnough ? '' : 'bg-red-50'}>
                                                    <td className="px-4 py-3 font-medium text-stone-900">{ing.name}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-amber-600">
                                                        {ing.needed.toLocaleString('fr-FR', {maximumFractionDigits: 2})} {ing.unit}
                                                    </td>
                                                    <td className={`px-4 py-3 text-right font-medium ${ing.hasEnough ? 'text-stone-700' : 'text-red-600'}`}>
                                                        {ing.current_stock.toLocaleString('fr-FR', {maximumFractionDigits: 2})} {ing.unit}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {ing.hasEnough ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                                                Suffisant
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                Rupture ({Math.abs(ing.current_stock - ing.needed).toLocaleString('fr-FR', {maximumFractionDigits: 2})} manquant)
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-6 border-t border-stone-100 mt-6">
                            <button
                                type="button"
                                onClick={() => router.get(feedProductionsIndex.url())}
                                className="px-4 py-2 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
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