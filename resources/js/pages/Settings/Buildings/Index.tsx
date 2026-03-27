import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import SettingsLayout from '@/layouts/settings/layout';
import { Plus, Edit2, Trash2, X, Building2 } from 'lucide-react';
import { useToasts } from '@/components/ToastProvider';
import { buildingsIndex, buildingsStore, buildingsUpdate, buildingsDestroy } from '@/routes';

interface Building {
    id: number;
    name: string;
    description: string | null;
    capacity: number | null;
}

interface Props {
    buildings: {
        data: Building[];
        current_page: number;
        last_page: number;
    };
    flash?: { success?: string; error?: string };
}

export default function Index({ buildings, flash }: Props) {
    const { addToast } = useToasts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, reset, processing, errors, clearErrors } = useForm({
        name: '',
        description: '',
        capacity: '',
    });

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (building: Building) => {
        clearErrors();
        setData({
            name: building.name,
            description: building.description || '',
            capacity: building.capacity ? building.capacity.toString() : '',
        });
        setEditingId(building.id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Ensure capacity is either a number or null/empty
        const payload = {
            ...data,
            capacity: data.capacity === '' ? null : parseInt(data.capacity)
        };

        if (editingId) {
            router.put(buildingsUpdate.url(editingId), payload, {
                preserveScroll: true,
                onSuccess: () => closeModal()
            });
        } else {
            router.post(buildingsStore.url(), payload, {
                preserveScroll: true,
                onSuccess: () => closeModal()
            });
        }
    };

    const handleDelete = (building: Building) => {
        if (confirm(`Voulez-vous vraiment supprimer le bâtiment "${building.name}" ?`)) {
            router.delete(buildingsDestroy.url(building.id));
        }
    };

    return (
        <SettingsLayout breadcrumbs={[{ title: 'Bâtiments', href: buildingsIndex.url() }]}>
            <Head title="Gestion des Bâtiments" />

            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-medium text-stone-900">Bâtiments</h2>
                        <p className="text-sm text-stone-500 mt-1">Gérez les espaces de votre ferme et leurs capacités.</p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Ajouter un Bâtiment
                    </button>
                </div>

                <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 text-stone-500 font-medium border-b border-stone-200">
                            <tr>
                                <th className="px-6 py-3">Nom</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3 text-right">Capacité (Poules)</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white">
                            {buildings.data.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-stone-500">
                                        Aucun bâtiment configuré.
                                    </td>
                                </tr>
                            ) : (
                                buildings.data.map(building => (
                                    <tr key={building.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-stone-900 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            {building.name}
                                        </td>
                                        <td className="px-6 py-4 text-stone-600">{building.description || '-'}</td>
                                        <td className="px-6 py-4 text-right text-stone-900 font-medium">
                                            {building.capacity ? building.capacity.toLocaleString('fr-FR') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(building)}
                                                    className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(building)}
                                                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                            <h3 className="text-lg font-medium text-stone-900">
                                {editingId ? 'Modifier le bâtiment' : 'Nouveau bâtiment'}
                            </h3>
                            <button onClick={closeModal} className="text-stone-400 hover:text-stone-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Nom *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-lg border-stone-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Capacité maximale (poules)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.capacity}
                                    onChange={e => setData('capacity', e.target.value)}
                                    className="w-full rounded-lg border-stone-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Ex: 5000"
                                />
                                {errors.capacity && <p className="text-red-500 text-xs mt-1">{errors.capacity}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border-stone-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm resize-none"
                                />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {editingId ? 'Mettre à jour' : 'Créer le bâtiment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SettingsLayout>
    );
}