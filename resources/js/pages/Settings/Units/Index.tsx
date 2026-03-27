import React, { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import SettingsLayout from '@/layouts/settings/layout';
import { useToasts } from '@/components/ToastProvider';
import { ActionButton } from '@/components/action-button-made';
import { unitsIndex, unitsCreate, unitsEdit, unitsDestroy, unitsStore } from '@/routes';


// Types pour les unités
interface Unit {
    id: number;
    name: string;
    symbol: string;
    type: 'mass' | 'volume' | 'unit';
    base_unit_name?: string | null;
    conversion_factor?: number | null;
}

interface PaginatedUnits {
    data: Unit[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface PageProps {
    units: PaginatedUnits;
    baseUnits?: Unit[]; // pour les formulaires de création/édition
    flash?: { success?: string; error?: string };
}

export default function UnitsIndex({ units, flash }: PageProps) {
    const { addToast } = useToasts();

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const handleDelete = (unit: Unit) => {
        if (!confirm(`Supprimer l'unité "${unit.name}" ?`)) return;
        router.delete(unitsDestroy.url(unit.id));
    };

    return (
        <SettingsLayout breadcrumbs={[{ title: 'Unités de mesure', href: unitsIndex.url() }]}>
            <Head title="Unités de mesure" />
            <div className="bg-white rounded-xl">

                <div className="px-8 py-6 border-b border-stone-200">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                                Unités de mesure
                            </h1>
                            <p className="text-stone-500 text-sm mt-0.5">
                                {units.total} unité{units.total !== 1 ? 's' : ''} au total
                            </p>
                        </div>
                        <button
                            onClick={() => router.get(unitsCreate.url())}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nouvelle unité
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
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Symbole</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Type</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Unité de base</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Facteur conversion</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {units.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-stone-400 text-sm">
                                                Aucune unité trouvée.
                                            </td>
                                        </tr>
                                    ) : (
                                        units.data.map(unit => (
                                            <tr key={unit.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-5 py-4 font-medium text-stone-900">{unit.name}</td>
                                                <td className="px-5 py-4 text-stone-600">{unit.symbol}</td>
                                                <td className="px-5 py-4 text-stone-600">
                                                    {unit.type === 'mass' ? 'Masse' : unit.type === 'volume' ? 'Volume' : 'Unité'}
                                                </td>
                                                <td className="px-5 py-4 text-stone-600">{unit.base_unit_name || '-'}</td>
                                                <td className="px-5 py-4 text-stone-600">{unit.conversion_factor || '-'}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <ActionButton
                                                            icon={<Edit2 className="w-4 h-4" />}
                                                            title="Modifier"
                                                            colorClass="hover:text-amber-600 hover:bg-amber-50"
                                                            onClick={() => router.get(unitsEdit.url(unit.id))}
                                                        />
                                                        <ActionButton
                                                            icon={<Trash2 className="w-4 h-4" />}
                                                            title="Supprimer"
                                                            colorClass="hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDelete(unit)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {units.last_page > 1 && (
                            <div className="border-t border-stone-100 px-5 py-4 flex items-center justify-between text-sm text-stone-500">
                                <span>Page {units.current_page} sur {units.last_page} — {units.total} résultats</span>
                                <div className="flex gap-1">
                                    <button
                                        disabled={units.current_page === 1}
                                        onClick={() => router.get(unitsIndex.url(), { page: units.current_page - 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={units.current_page === units.last_page}
                                        onClick={() => router.get(unitsIndex.url(), { page: units.current_page + 1 })}
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