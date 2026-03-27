import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Trash2, Receipt, Save, ArrowLeft, Egg, Users, Package } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { invoicesIndex, invoicesStore } from '@/routes';
import { formatCurrency } from '@/lib/utils';

interface Flock {
    id: number;
    name: string;
}

interface Props {
    activeFlocks: Flock[];
    customers: { id: number; name: string }[];
    nextInvoiceNumber: string;
    import?: {
        itemable_id: number;
        itemable_type: string;
        description: string;
        quantity: number;
        unit_price: number;
    };
}

// Icônes par type de produit
const typeIcons: Record<string, React.ReactNode> = {
    'App\\Models\\EggMovement': <Egg className="w-4 h-4" />,
    'App\\Models\\Flock': <Users className="w-4 h-4" />,
    'default': <Package className="w-4 h-4" />
};

export default function Create({ activeFlocks, customers, nextInvoiceNumber, import: importData }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        number: nextInvoiceNumber,
        partner_id: '',
        date: new Date().toISOString().split('T')[0],
        items: importData ? [importData] : [
            { description: '', quantity: 1, unit_price: 0, itemable_id: null, itemable_type: '' }
        ]
    });

    const addItem = () => {
        setData('items', [...data.items, { description: '', quantity: 1, unit_price: 0, itemable_id: null, itemable_type: '' }]);
    };

    const removeItem = (index: number) => {
        if (data.items.length === 1) return;
        const newItems = [...data.items];
        newItems.splice(index, 1);
        setData('items', newItems);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        (newItems[index] as any)[field] = value;

        // Auto-description basée sur la sélection
        if (field === 'itemable_type') {
            newItems[index].itemable_id = null; // reset id
            if (value === 'App\\Models\\EggMovement') {
                newItems[index].description = 'Plateaux d\'œufs';
            }
        }
        if (field === 'itemable_id' && newItems[index].itemable_type === 'App\\Models\\Flock') {
            const flock = activeFlocks.find(f => f.id === Number(value));
            if (flock) {
                newItems[index].description = `Poules de réforme (Lot ${flock.name})`;
            }
        }

        setData('items', newItems);
    };

    const totalHT = data.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
    const totalItems = data.items.reduce((sum, item) => sum + Number(item.quantity), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(invoicesStore.url());
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Factures', href: invoicesIndex.url() }, { title: 'Nouvelle', href: '#' }]}>
            <Head title="Nouvelle Facture" />
            <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

                {/* En-tête avec retour */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => router.get(invoicesIndex.url())}
                        className="p-2 text-stone-400 hover:text-stone-900 bg-white border border-stone-200 rounded-lg shadow-sm transition-colors"
                        aria-label="Retour à la liste"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-indigo-600" />
                        Nouvelle Facture
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Section Informations générales */}
                    <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-stone-900 mb-4 border-b border-stone-100 pb-3 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-indigo-500" />
                            Informations générales
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Numéro <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.number}
                                    onChange={e => setData('number', e.target.value)}
                                    className="w-full rounded-md border-stone-300 bg-stone-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                                    readOnly
                                />
                                {errors.number && <p className="mt-1 text-xs text-red-600">{errors.number}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Client <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.partner_id}
                                    onChange={e => setData('partner_id', e.target.value)}
                                    className="w-full rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                >
                                    <option value="">Sélectionner un client</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                {errors.partner_id && <p className="mt-1 text-xs text-red-600">{errors.partner_id}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={data.date}
                                    onChange={e => setData('date', e.target.value)}
                                    className="w-full rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                />
                                {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section Lignes de facture */}
                    <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex flex-wrap justify-between items-center gap-4">
                            <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                                <Package className="w-5 h-5 text-indigo-500" />
                                Articles facturés
                            </h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 text-stone-700 text-sm font-medium rounded-md hover:bg-stone-50 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Ajouter une ligne
                            </button>
                        </div>

                        {/* Version desktop : tableau */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-white border-b border-stone-200">
                                    <tr className="text-left text-stone-500 font-medium">
                                        <th className="px-4 py-3 w-1/5">Type de produit</th>
                                        <th className="px-4 py-3 w-1/5">Lien (optionnel)</th>
                                        <th className="px-4 py-3 w-1/4">Description <span className="text-red-500">*</span></th>
                                        <th className="px-4 py-3 w-32 text-right">Quantité <span className="text-red-500">*</span></th>
                                        <th className="px-4 py-3 w-32 text-right">Prix unitaire <span className="text-red-500">*</span></th>
                                        <th className="px-4 py-3 w-32 text-right">Total</th>
                                        <th className="px-4 py-3 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {data.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-stone-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {typeIcons[item.itemable_type] || typeIcons.default}
                                                    <select
                                                        value={item.itemable_type}
                                                        onChange={e => updateItem(idx, 'itemable_type', e.target.value)}
                                                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                    >
                                                        <option value="">Standard (Autre)</option>
                                                        <option value="App\Models\EggMovement">Vente d'œufs</option>
                                                        <option value="App\Models\Flock">Vente de poules (Réforme)</option>
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.itemable_type === 'App\\Models\\Flock' ? (
                                                    <select
                                                        value={item.itemable_id || ''}
                                                        onChange={e => updateItem(idx, 'itemable_id', e.target.value)}
                                                        className="w-full rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                    >
                                                        <option value="">Sélectionner un Lot</option>
                                                        {activeFlocks.map(f => (
                                                            <option key={f.id} value={f.id}>{f.name}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className="text-stone-400 text-xs italic">Non applicable</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={e => updateItem(idx, 'description', e.target.value)}
                                                    className="w-full rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                    required
                                                    placeholder="Description..."
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0.1" step="0.1"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                    className="w-full text-right rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                    required
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    min="0" step="0.01"
                                                    value={item.unit_price}
                                                    onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                                                    className="w-full text-right rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                                                    required
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-stone-900 bg-stone-50/50">
                                                {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(idx)}
                                                    disabled={data.items.length === 1}
                                                    className="p-1.5 text-stone-400 hover:text-red-600 disabled:opacity-30 rounded transition-colors"
                                                    title="Supprimer cette ligne"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-stone-50 border-t border-stone-200">
                                    <tr>
                                        <td colSpan={5} className="px-4 py-4 text-right font-semibold text-stone-900 text-base">
                                            Total articles : <span className="font-bold">{totalItems}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right font-bold text-indigo-700 text-xl">
                                            {formatCurrency(totalHT)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Version mobile : cartes */}
                        <div className="md:hidden space-y-4 p-4">
                            {data.items.map((item, idx) => (
                                <div key={idx} className="border border-stone-200 rounded-lg p-4 space-y-3 bg-white">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            {typeIcons[item.itemable_type] || typeIcons.default}
                                            <span className="font-medium text-stone-700">Ligne {idx+1}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            disabled={data.items.length === 1}
                                            className="p-1.5 text-stone-400 hover:text-red-600 disabled:opacity-30"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-stone-500">Type</label>
                                            <select
                                                value={item.itemable_type}
                                                onChange={e => updateItem(idx, 'itemable_type', e.target.value)}
                                                className="w-full mt-1 rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                                            >
                                                <option value="">Autre</option>
                                                <option value="App\Models\EggMovement">Œufs</option>
                                                <option value="App\Models\Flock">Poules</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-stone-500">Lien</label>
                                            {item.itemable_type === 'App\\Models\\Flock' ? (
                                                <select
                                                    value={item.itemable_id || ''}
                                                    onChange={e => updateItem(idx, 'itemable_id', e.target.value)}
                                                    className="w-full mt-1 rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                                                >
                                                    <option value="">Lot</option>
                                                    {activeFlocks.map(f => (
                                                        <option key={f.id} value={f.id}>{f.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-stone-400 text-xs italic block mt-1">—</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-stone-500">Description *</label>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={e => updateItem(idx, 'description', e.target.value)}
                                            className="w-full mt-1 rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                                            required
                                            placeholder="Description"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-stone-500">Quantité *</label>
                                            <input
                                                type="number"
                                                min="0.1" step="0.1"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                className="w-full mt-1 text-right rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-stone-500">Prix unitaire *</label>
                                            <input
                                                type="number"
                                                min="0" step="0.01"
                                                value={item.unit_price}
                                                onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                                                className="w-full mt-1 text-right rounded-md border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                                        <span className="text-sm text-stone-600">Total ligne</span>
                                        <span className="font-semibold text-indigo-700">
                                            {formatCurrency(Number(item.quantity) * Number(item.unit_price))}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div className="bg-stone-50 rounded-lg p-4 flex justify-between items-center">
                                <span className="text-sm font-medium text-stone-700">Total général</span>
                                <span className="text-xl font-bold text-indigo-700">{formatCurrency(totalHT)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => router.get(invoicesIndex.url())}
                            className="px-6 py-2.5 bg-white border border-stone-300 text-stone-700 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors shadow-sm"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={processing || data.items.length === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            {processing ? 'Création...' : 'Créer la facture'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}