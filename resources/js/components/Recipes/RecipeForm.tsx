import React from 'react';
import RecipeIngredients from './RecipeIngredients';

interface RecipeFormData {
    name: string;
    description: string;
    yield_quantity: string;
    yield_unit_id: string;
    is_active: boolean;
    ingredients: Array<{
        ingredient_id: string;
        quantity: string;
        unit_id: string;
    }>;
}

interface Props {
    data: RecipeFormData;
    setData: (key: keyof RecipeFormData, value: any) => void;
    errors: Record<string, string>;
    ingredients: { id: number; name: string; default_unit_id: number; default_unit_symbol: string }[];
    units: { id: number; name: string; symbol: string }[];
}

export default function RecipeForm({ data, setData, errors, ingredients, units }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Nom *</label>
                <input
                    type="text"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Ex: Aliment pondeuse 18%"
                    required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Description</label>
                <textarea
                    value={data.description}
                    onChange={e => setData('description', e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    placeholder="Description de la recette..."
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Rendement (quantité produite) *</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.yield_quantity}
                        onChange={e => setData('yield_quantity', e.target.value)}
                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="Ex: 100"
                        required
                    />
                    {errors.yield_quantity && <p className="text-red-500 text-xs mt-1">{errors.yield_quantity}</p>}
                </div>
                <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1.5">Unité de rendement *</label>
                    <select
                        value={data.yield_unit_id}
                        onChange={e => setData('yield_unit_id', e.target.value)}
                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                        required
                    >
                        <option value="">Sélectionner</option>
                        {units.map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                        ))}
                    </select>
                    {errors.yield_unit_id && <p className="text-red-500 text-xs mt-1">{errors.yield_unit_id}</p>}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="is_active"
                    checked={data.is_active}
                    onChange={e => setData('is_active', e.target.checked)}
                    className="rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="is_active" className="text-sm text-stone-600">Recette active (disponible pour les productions)</label>
            </div>

            {/* Lignes d'ingrédients */}
            <RecipeIngredients
                ingredients={data.ingredients}
                setIngredients={(ings) => setData('ingredients', ings)}
                availableIngredients={ingredients}
                units={units}
                errors={errors}
            />
        </div>
    );
}