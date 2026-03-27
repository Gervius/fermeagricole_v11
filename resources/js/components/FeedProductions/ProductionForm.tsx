import React from 'react';

interface ProductionFormData {
    recipe_id: string;
    production_date: string;
    quantity: string;
    notes: string;
}

interface Props {
    data: ProductionFormData;
    setData: (key: keyof ProductionFormData, value: string) => void;
    errors: Record<string, string>;
    recipes: { id: number; name: string; yield_unit: string }[];
    showIngredientDetails?: boolean; // pour afficher un récap des ingrédients nécessaires (optionnel)
    ingredientDetails?: { name: string; quantity: number; unit: string }[];
}

export default function ProductionForm({ data, setData, errors, recipes, showIngredientDetails, ingredientDetails }: Props) {
    const selectedRecipe = recipes.find(r => r.id.toString() === data.recipe_id);

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Recette *</label>
                <select
                    value={data.recipe_id}
                    onChange={e => setData('recipe_id', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    required
                >
                    <option value="">Sélectionner une recette</option>
                    {recipes.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
                {errors.recipe_id && <p className="text-red-500 text-xs mt-1">{errors.recipe_id}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Date de production *</label>
                <input
                    type="date"
                    value={data.production_date}
                    onChange={e => setData('production_date', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                />
                {errors.production_date && <p className="text-red-500 text-xs mt-1">{errors.production_date}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    Quantité produite * {selectedRecipe && `(${selectedRecipe.yield_unit})`}
                </label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.quantity}
                    onChange={e => setData('quantity', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Ex: 1000"
                    required
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Notes (optionnel)</label>
                <textarea
                    value={data.notes}
                    onChange={e => setData('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    placeholder="Informations complémentaires..."
                />
                {errors.notes && <p className="text-red-500 text-xs mt-1">{errors.notes}</p>}
            </div>

            {showIngredientDetails && ingredientDetails && ingredientDetails.length > 0 && (
                <div className="mt-4 p-3 bg-stone-50 rounded-lg">
                    <h3 className="text-sm font-medium text-stone-700 mb-2">Ingrédients nécessaires :</h3>
                    <ul className="space-y-1 text-xs">
                        {ingredientDetails.map((ing, idx) => (
                            <li key={idx} className="flex justify-between">
                                <span>{ing.name}</span>
                                <span className="font-medium">{ing.quantity} {ing.unit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}