// Components/Recipes/RecipeIngredients.tsx
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface IngredientLine {
    id?: number;          // pour l'édition (si on a un ID)
    ingredient_id: string;
    quantity: string;
    unit_id: string;
}

interface Props {
    ingredients: IngredientLine[];
    setIngredients: (ingredients: IngredientLine[]) => void;
    availableIngredients: { id: number; name: string; default_unit_id: number; default_unit_symbol: string }[];
    units: { id: number; name: string; symbol: string }[];
    errors?: Record<string, string>;
}

export default function RecipeIngredients({ ingredients, setIngredients, availableIngredients, units, errors }: Props) {
    const addLine = () => {
        setIngredients([...ingredients, { ingredient_id: '', quantity: '', unit_id: '' }]);
    };

    const removeLine = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: keyof IngredientLine, value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index][field] = value;
        setIngredients(newIngredients);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Ingrédients de la recette</label>
                <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter un ingrédient
                </button>
            </div>

            {ingredients.length === 0 ? (
                <div className="text-sm text-stone-400 italic py-4 text-center border border-dashed border-stone-200 rounded-lg">
                    Aucun ingrédient défini. Cliquez sur "Ajouter" pour commencer.
                </div>
            ) : (
                <div className="space-y-3">
                    {ingredients.map((line, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-stone-50 rounded-lg">
                            <div className="flex-1">
                                <select
                                    value={line.ingredient_id}
                                    onChange={(e) => updateLine(index, 'ingredient_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                    required
                                >
                                    <option value="">Choisir un ingrédient</option>
                                    {availableIngredients.map(ing => (
                                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-28">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={line.quantity}
                                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    placeholder="Qté"
                                    required
                                />
                            </div>
                            <div className="w-24">
                                <select
                                    value={line.unit_id}
                                    onChange={(e) => updateLine(index, 'unit_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                    required
                                >
                                    <option value="">Unité</option>
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>{u.symbol}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeLine(index)}
                                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {errors?.ingredients && <p className="text-red-500 text-xs mt-1">{errors.ingredients}</p>}
        </div>
    );
}