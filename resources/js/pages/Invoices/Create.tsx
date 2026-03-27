// resources/js/Pages/Invoices/Create.tsx
import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Plus, Trash2, Receipt, Save, ArrowLeft, 
    Egg, Users, Package, ShoppingCart, Tag 
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { invoicesIndex, invoicesStore } from '@/routes';
import { formatCurrency } from '@/lib/utils';

interface Props {
    activeFlocks: { id: number; name: string }[];
    customers: { id: number; name: string; type: string }[]; // 'customer', 'supplier', 'both'
    nextInvoiceNumber: string;
}

export default function Create({ activeFlocks, customers, nextInvoiceNumber }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        number: nextInvoiceNumber,
        type: 'sale', // 'sale' ou 'purchase'
        partner_id: '',
        date: new Date().toISOString().split('T')[0],
        items: [
            { description: '', quantity: 1, unit_price: 0, itemable_id: null, itemable_type: '' }
        ]
    });

    // 1. Filtrage dynamique des partenaires selon le type de facture
    const filteredPartners = useMemo(() => {
        return customers.filter(p => 
            data.type === 'sale' 
                ? (p.type === 'customer' || p.type === 'both')
                : (p.type === 'supplier' || p.type === 'both')
        );
    }, [data.type, customers]);

    // 2. Gestion du changement de type (Achat/Vente)
    const handleTypeChange = (newType: 'sale' | 'purchase') => {
        const prefix = newType === 'sale' ? 'FAC-' : 'ACH-';
        // On ajuste le numéro de facture dynamiquement pour l'UX
        const updatedNumber = data.number.replace(/^(FAC|ACH)-/, prefix);
        
        setData(d => ({
            ...d,
            type: newType,
            number: updatedNumber,
            partner_id: '', // Reset du partenaire pour éviter les erreurs de type
            items: [{ description: '', quantity: 1, unit_price: 0, itemable_id: null, itemable_type: '' }]
        }));
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...data.items];
        (newItems[index] as any)[field] = value;
        setData('items', newItems);
    };

    const totalHT = data.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(invoicesStore.url());
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Factures', href: invoicesIndex.url() }, { title: 'Nouvelle', href: '#' }]}>
            <Head title="Nouvelle Facture" />
            <div className="max-w-5xl mx-auto py-8 px-4">
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* SÉLECTEUR DE TYPE : ACHAT vs VENTE */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-2 shadow-sm flex w-fit mx-auto gap-1">
                        <button
                            type="button"
                            onClick={() => handleTypeChange('sale')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                data.type === 'sale' 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                : 'text-stone-500 hover:bg-stone-50'
                            }`}
                        >
                            <Tag className="w-4 h-4" /> Vente (Client)
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTypeChange('purchase')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                data.type === 'purchase' 
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' 
                                : 'text-stone-500 hover:bg-stone-50'
                            }`}
                        >
                            <ShoppingCart className="w-4 h-4" /> Achat (Fournisseur)
                        </button>
                    </div>

                    {/* INFOS GÉNÉRALES */}
                    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Référence</label>
                                <input
                                    type="text"
                                    value={data.number}
                                    className="w-full rounded-xl border-stone-200 bg-stone-50 font-mono text-sm"
                                    readOnly
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-bold text-stone-400 uppercase mb-2">
                                    {data.type === 'sale' ? 'Client' : 'Fournisseur'}
                                </label>
                                <select
                                    value={data.partner_id}
                                    onChange={e => setData('partner_id', e.target.value)}
                                    className="w-full rounded-xl border-stone-200 text-sm focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Sélectionner...</option>
                                    {filteredPartners.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase mb-2">Date d'opération</label>
                                <input
                                    type="date"
                                    value={data.date}
                                    onChange={e => setData('date', e.target.value)}
                                    className="w-full rounded-xl border-stone-200 text-sm"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* LIGNES DE FACTURE */}
                    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-stone-50/50 border-b border-stone-100">
                                <tr className="text-stone-400 text-xs uppercase font-black">
                                    <th className="px-6 py-4 text-left">Article / Description</th>
                                    <th className="px-6 py-4 text-right w-32">Quantité</th>
                                    <th className="px-6 py-4 text-right w-40">Prix Unit.</th>
                                    <th className="px-6 py-4 text-right w-40">Total</th>
                                    <th className="px-6 py-4 w-16"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {data.items.map((item, idx) => (
                                    <tr key={idx} className="group">
                                        <td className="px-6 py-4">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={e => updateItem(idx, 'description', e.target.value)}
                                                placeholder={data.type === 'sale' ? "Ex: Plateaux d'oeufs..." : "Ex: Sacs d'aliments..."}
                                                className="w-full border-none focus:ring-0 p-0 text-stone-900 font-medium placeholder:text-stone-300"
                                            />
                                            {/* Sélecteur de lien stock (Flock) si nécessaire */}
                                            {data.type === 'sale' && (
                                                <div className="flex gap-2 mt-2">
                                                    <select 
                                                        onChange={e => updateItem(idx, 'itemable_type', e.target.value)}
                                                        className="text-[10px] py-0.5 border-stone-200 rounded"
                                                    >
                                                        <option value="">Type Stock</option>
                                                        <option value="App\Models\EggMovement">Oeufs</option>
                                                        <option value="App\Models\Flock">Poules (Réforme)</option>
                                                    </select>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                className="w-full text-right border-stone-100 rounded-lg text-sm"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <input
                                                type="number"
                                                value={item.unit_price}
                                                onChange={e => updateItem(idx, 'unit_price', e.target.value)}
                                                className="w-full text-right border-stone-100 rounded-lg text-sm"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-stone-900">
                                            {formatCurrency(item.quantity * item.unit_price)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const newItems = data.items.filter((_, i) => i !== idx);
                                                    setData('items', newItems);
                                                }}
                                                className="text-stone-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div className="p-4 bg-stone-50/50 border-t border-stone-100 flex justify-between items-center">
                            <button
                                type="button"
                                onClick={() => setData('items', [...data.items, { description: '', quantity: 1, unit_price: 0, itemable_id: null, itemable_type: '' }])}
                                className="flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                            >
                                <Plus className="w-4 h-4" /> Ajouter une ligne
                            </button>
                            <div className="text-right">
                                <p className="text-xs font-bold text-stone-400 uppercase">Total Net à payer</p>
                                <p className="text-2xl font-black text-stone-900">{formatCurrency(totalHT)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => router.get(invoicesIndex.url())}
                            className="px-6 py-3 text-sm font-bold text-stone-500 hover:text-stone-700"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                                data.type === 'sale' ? 'bg-indigo-600 shadow-indigo-200' : 'bg-amber-600 shadow-amber-200'
                            }`}
                        >
                            <Save className="w-4 h-4" />
                            {processing ? 'Enregistrement...' : 'Enregistrer la facture'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}