// resources/js/Components/EggSales/EggSaleForm.tsx
import React from 'react';
import { useForm } from '@inertiajs/react';

interface EggSaleFormData {
    sale_date: string;
    flock_id: string;
    customer_name: string;
    quantity: string;
    unit_price: string;
    tax_rate: string;
}

interface Props {
    data: EggSaleFormData;
    setData: (key: keyof EggSaleFormData, value: string) => void;
    errors: Record<string, string>;
    flocks: { id: number; name: string }[];
    isEditing?: boolean;
}

export default function EggSaleForm({ data, setData, errors, flocks, isEditing }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Date de vente *</label>
                <input
                    type="date"
                    value={data.sale_date}
                    onChange={e => setData('sale_date', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                />
                {errors.sale_date && <p className="text-red-500 text-xs mt-1">{errors.sale_date}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Lot *</label>
                <select
                    value={data.flock_id}
                    onChange={e => setData('flock_id', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    required
                >
                    <option value="">Sélectionner un lot</option>
                    {flocks?.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
                {errors.flock_id && <p className="text-red-500 text-xs mt-1">{errors.flock_id}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Client</label>
                <input
                    type="text"
                    value={data.customer_name}
                    onChange={e => setData('customer_name', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Nom du client"
                />
                {errors.customer_name && <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Quantité (œufs) *</label>
                <input
                    type="number"
                    min="1"
                    step="1"
                    value={data.quantity}
                    onChange={e => setData('quantity', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Ex: 1000"
                    required
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Prix unitaire (FCFA) *</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.unit_price}
                    onChange={e => setData('unit_price', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="0.00"
                    required
                />
                {errors.unit_price && <p className="text-red-500 text-xs mt-1">{errors.unit_price}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Taux TVA (%)</label>
                <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={data.tax_rate}
                    onChange={e => setData('tax_rate', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="0"
                />
                {errors.tax_rate && <p className="text-red-500 text-xs mt-1">{errors.tax_rate}</p>}
            </div>

            {isEditing && (
                <p className="text-xs text-stone-500 italic">
                    Les champs marqués d'un * sont obligatoires.
                </p>
            )}
        </div>
    );
}