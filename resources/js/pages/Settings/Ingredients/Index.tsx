import React, { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Search, AlertTriangle } from 'lucide-react';
import SettingsLayout from '@/layouts/settings/layout';
import { useToasts } from '@/components/ToastProvider';
import { ActionButton } from '@/components/action-button-made';
import { ingredientsIndex, ingredientsCreate, ingredientsEdit, ingredientsDestroy } from '@/routes';

interface Ingredient {
    id: number;
    name: string;
    reference: string | null;
    default_unit: string; // nom de l'unité par défaut
    current_stock: number;
    min_stock: number | null;
    max_stock: number | null;
    description: string | null;
    is_active: boolean;
    // Permissions
    can_edit: boolean;
    can_delete: boolean;
}

interface PaginatedIngredients {
    data: Ingredient[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface UnitOption {
    id: number;
    name: string;
    symbol: string;
}

interface PageProps {
    ingredients: PaginatedIngredients;
    units: UnitOption[]; // pour les formulaires de création/édition
    flash?: { success?: string; error?: string };
}

export default function IngredientsIndex({ ingredients, flash }: PageProps) {
    const { addToast } = useToasts();

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const handleDelete = (ingredient: Ingredient) => {
        if (!confirm(`Supprimer l'ingrédient "${ingredient.name}" ?`)) return;
        router.delete(ingredientsDestroy.url(ingredient.id));
    };

    return (
        <SettingsLayout breadcrumbs={[{ title: 'Ingrédients', href: ingredientsIndex.url() }]}>
            <Head title="Ingrédients" />
            <div className="bg-white rounded-xl">

                <div className="px-8 py-6 border-b border-stone-200">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                                Ingrédients (matières premières)
                            </h1>
                            <p className="text-stone-500 text-sm mt-0.5">
                                {ingredients.total} ingrédient{ingredients.total !== 1 ? 's' : ''} au total
                            </p>
                        </div>
                        <button
                            onClick={() => router.get(ingredientsCreate.url())}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nouvel ingrédient
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
                    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-stone-100 bg-stone-50">
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Nom</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Référence</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Stock actuel</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Seuil min</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Unité</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Statut</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {ingredients.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-stone-400 text-sm">
                                                Aucun ingrédient trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        ingredients.data.map(ing => (
                                            <tr key={ing.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-5 py-4 font-medium text-stone-900">{ing.name}</td>
                                                <td className="px-5 py-4 text-stone-600">{ing.reference || '-'}</td>
                                                <td className="px-5 py-4">
                                                    <span className="font-medium">{ing.current_stock.toLocaleString('fr-FR')}</span>
                                                    {ing.min_stock && ing.current_stock <= ing.min_stock && (
                                                        <AlertTriangle className="inline ml-2 w-4 h-4 text-amber-500">
                                                            Stock bas
                                                        </AlertTriangle>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-stone-600">{ing.min_stock ?? '-'}</td>
                                                <td className="px-5 py-4 text-stone-600">{ing.default_unit}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ing.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {ing.is_active ? 'Actif' : 'Inactif'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1">
                                                        {ing.can_edit && (
                                                            <ActionButton
                                                                icon={<Edit2 className="w-4 h-4" />}
                                                                title="Modifier"
                                                                colorClass="hover:text-amber-600 hover:bg-amber-50"
                                                                onClick={() => router.get(ingredientsEdit.url(ing.id))}
                                                            />
                                                        )}
                                                        {ing.can_delete && (
                                                            <ActionButton
                                                                icon={<Trash2 className="w-4 h-4" />}
                                                                title="Supprimer"
                                                                colorClass="hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => handleDelete(ing)}
                                                            />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {ingredients.last_page > 1 && (
                            <div className="border-t border-stone-100 px-5 py-4 flex items-center justify-between text-sm text-stone-500">
                                <span>Page {ingredients.current_page} sur {ingredients.last_page} — {ingredients.total} résultats</span>
                                <div className="flex gap-1">
                                    <button
                                        disabled={ingredients.current_page === 1}
                                        onClick={() => router.get(ingredientsIndex.url(), { page: ingredients.current_page - 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={ingredients.current_page === ingredients.last_page}
                                        onClick={() => router.get(ingredientsIndex.url(), { page: ingredients.current_page + 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </SettingsLayout>
    );
}