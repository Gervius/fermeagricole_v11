import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import RecipeForm from '@/components/Recipes/RecipeForm';
import { recipesCreate, recipesStore, recipesIndex } from '@/routes';

interface Props {
    ingredients: {
        quantity: number;
        rawMaterialId: any; id: number; name: string; default_unit_id: number; default_unit_symbol: string
}[];
    units: { id: number; name: string; symbol: string }[];
}

export default function Create({ ingredients, units }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        yield_quantity: '',
        yield_unit_id: '',
        is_active: true,
        ingredients: [],
    });



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(recipesStore.url(), {
            onSuccess: () => router.get(recipesIndex.url()),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Nouvelle recette', href: recipesCreate.url() }]}>
            <Head title="Nouvelle recette" />
            <div className="max-w-3xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Nouvelle recette</h1>
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
                                Créer la recette
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}

function setShowCreateModal(arg0: boolean) {
    throw new Error('Function not implemented.');
}
