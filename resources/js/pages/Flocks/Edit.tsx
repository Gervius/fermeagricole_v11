import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { AlertCircle, ChevronLeft } from 'lucide-react';
import { flocksEdit, flocksUpdate } from '@/routes';

interface Building {
    id: number;
    name: string;
}

interface PageProps {
    flock: {
        id: number;
        name: string;
        building_id: number;
        arrival_date: string;
        initial_quantity: number;
        notes: string;
    };
    buildings: Building[];
}

export default function Edit({ flock, buildings }: PageProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: flock.name,
        building_id: flock.building_id,
        arrival_date: flock.arrival_date,
        initial_quantity: flock.initial_quantity,
        notes: flock.notes || '',
    });

    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(flocksUpdate.url(flock.id), {
            onSuccess: () => setShowConfirm(false),
        });
    };

    const inputClass =
        'w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white';

    const errorClass = 'text-red-600 text-xs mt-1';

    return (
        <AppLayout>
            <Head title="Modifier un lot" />
            <div className="min-h-screen bg-stone-50 font-sans">

                {/* Header */}
                <div className="bg-white border-b border-stone-200 px-8 py-6">
                    <div className="max-w-2xl mx-auto flex items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                            title="Retour"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                                Modifier le lot
                            </h1>
                            <p className="text-stone-500 text-sm mt-0.5">
                                Lot #{flock.id}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-8 py-8">

                    {/* Info Banner */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium mb-1">Modifications limitées</p>
                            <p className="text-amber-700">Certains champs ne peuvent être modifiés que si le lot est en brouillon.</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-8 space-y-6">

                        {/* Nom */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-stone-900 mb-2">
                                Nom du lot
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="Ex : G-2024-03"
                                className={inputClass}
                            />
                            {errors.name && <div className={errorClass}>{errors.name}</div>}
                        </div>

                        {/* Bâtiment */}
                        <div>
                            <label htmlFor="building_id" className="block text-sm font-medium text-stone-900 mb-2">
                                Bâtiment
                            </label>
                            <select
                                id="building_id"
                                value={data.building_id}
                                onChange={e => setData('building_id', Number(e.target.value))}
                                className={inputClass}
                            >
                                <option value="">Sélectionner un bâtiment</option>
                                {buildings.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                            {errors.building_id && <div className={errorClass}>{errors.building_id}</div>}
                        </div>

                        {/* Date d'arrivée */}
                        <div>
                            <label htmlFor="arrival_date" className="block text-sm font-medium text-stone-900 mb-2">
                                Date d'arrivée
                            </label>
                            <input
                                id="arrival_date"
                                type="date"
                                value={data.arrival_date}
                                onChange={e => setData('arrival_date', e.target.value)}
                                className={inputClass}
                            />
                            {errors.arrival_date && <div className={errorClass}>{errors.arrival_date}</div>}
                        </div>

                        {/* Quantité initiale */}
                        <div>
                            <label htmlFor="initial_quantity" className="block text-sm font-medium text-stone-900 mb-2">
                                Quantité initiale
                            </label>
                            <input
                                id="initial_quantity"
                                type="number"
                                value={data.initial_quantity}
                                onChange={e => setData('initial_quantity', Number(e.target.value))}
                                placeholder="Ex : 5000"
                                min="1"
                                className={inputClass}
                            />
                            {errors.initial_quantity && <div className={errorClass}>{errors.initial_quantity}</div>}
                        </div>

                        {/* Notes */}
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-stone-900 mb-2">
                                Notes <span className="text-stone-400">(optionnel)</span>
                            </label>
                            <textarea
                                id="notes"
                                value={data.notes}
                                onChange={e => setData('notes', e.target.value)}
                                placeholder="Observations, contexte particulier, etc."
                                rows={4}
                                className={`${inputClass} resize-none`}
                            />
                            {errors.notes && <div className={errorClass}>{errors.notes}</div>}
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-stone-100">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={processing}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}