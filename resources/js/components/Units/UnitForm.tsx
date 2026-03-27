import React from 'react';

interface UnitFormData {
    name: string;
    symbol: string;
    type: 'mass' | 'volume' | 'unit';
    base_unit_id: string;
    conversion_factor: string;
}

interface Props {
    data: UnitFormData;
    setData: (key: keyof UnitFormData, value: string) => void;
    errors: Record<string, string>;
    baseUnits: { id: number; name: string; symbol: string }[];
}

export default function UnitForm({ data, setData, errors, baseUnits }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Nom *</label>
                <input
                    type="text"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Ex: Kilogramme"
                    required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Symbole *</label>
                <input
                    type="text"
                    value={data.symbol}
                    onChange={e => setData('symbol', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Ex: kg"
                    required
                />
                {errors.symbol && <p className="text-red-500 text-xs mt-1">{errors.symbol}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Type *</label>
                <select
                    value={data.type}
                    onChange={e => setData('type', e.target.value as any)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                    <option value="mass">Masse</option>
                    <option value="volume">Volume</option>
                    <option value="unit">Unité</option>
                </select>
                {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Unité de base (pour conversion)</label>
                <select
                    value={data.base_unit_id}
                    onChange={e => setData('base_unit_id', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                >
                    <option value="">Aucune</option>
                    {baseUnits.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                    ))}
                </select>
                {errors.base_unit_id && <p className="text-red-500 text-xs mt-1">{errors.base_unit_id}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Facteur de conversion</label>
                <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={data.conversion_factor}
                    onChange={e => setData('conversion_factor', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Ex: 0.001 pour gramme vers kilogramme"
                />
                {errors.conversion_factor && <p className="text-red-500 text-xs mt-1">{errors.conversion_factor}</p>}
                <p className="text-xs text-stone-400 mt-1">
                    Le facteur multiplié par l'unité de base donne cette unité. Laissez vide si c'est l'unité de base.
                </p>
            </div>
        </div>
    );
}