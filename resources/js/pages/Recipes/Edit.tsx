import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import RecipeForm from '@/components/Recipes/RecipeForm';
import { recipesUpdate, recipesIndex } from '@/routes';

interface Props {
    recipe: {
        id: number;
        name: string;
        description: string | null;
        yield: number;
        unit_id: number;
        is_active: boolean;
        ingredients: Array<{
            id?: number;
            pivot: {
                ingredient_id: number;
                quantity: number;
                unit_id: number;
            };
        }>;
    };
    ingredients: { id: number; name: string; default_unit_id: number; default_unit_symbol: string }[];
    units: { id: number; name: string; symbol: string }[];
}

export default function Edit({ recipe, ingredients, units }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        name: recipe.name,
        description: recipe.description || '',
        yield_quantity: recipe.yield.toString(),
        yield_unit_id: recipe.unit_id.toString(),
        is_active: recipe.is_active,
        ingredients: recipe.ingredients.map(ing => ({
            id: ing.id,
            ingredient_id: ing.pivot.ingredient_id.toString(),
            quantity: ing.pivot.quantity.toString(),
            unit_id: ing.pivot.unit_id.toString(),
        })),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(recipesUpdate.url(recipe.id), {
            onSuccess: () => router.get(recipesIndex.url()),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Modifier recette', href: recipesUpdate.url(recipe.id) }]}>
            <Head title="Modifier recette" />
            <div className="max-w-3xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Modifier la recette</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <RecipeForm
                            data={data}
                            setData={(key, value) => setData(key as any, value)}
                            errors={errors}
                            ingredients={ingredients}
                            units={units}
                        />
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.get(recipesIndex.url())}
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