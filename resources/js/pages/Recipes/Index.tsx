import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Trash2, BookOpen, GripVertical, ArrowRight, Package } from 'lucide-react';
import { useToasts } from '@/components/ToastProvider';


// --- Interfaces (adapted to current backend data structure) ---
interface RawMaterial {
    id: number;
    name: string;
    stock_quantity: number;
    unit_name: string;
    pmp: number; // Prix Moyen Pondéré
}

interface RecipeIngredient {
    id: string;
    ingredient_id: number;
    quantity: number;
}

interface Recipe {
    id: number;
    code: string;
    name: string;
    description: string | null;
    yield_quantity: number;
    yield_unit: string;
    is_active: boolean;
    ingredients: { ingredient_id: number; quantity: number }[];
    total_cost?: number; // Calculated on backend or frontend
}

interface PageProps {
    recipes: Recipe[]; // For this layout, we'll assume the backend sends all recipes or we display a grid
    rawMaterials: RawMaterial[]; // We need the backend to send rawMaterials to use the exact UI design
    canManage: boolean;
    flash?: { success?: string; error?: string };
}

const ItemTypes = {
    RAW_MATERIAL: 'raw_material',
};

// Carte d'ingrédient draggable depuis la bibliothèque
function DraggableRawMaterial({ material }: { material: RawMaterial }) {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.RAW_MATERIAL,
        item: { material },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }), [material]);

    return (
        <div
            ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
            className={`bg-white border-2 border-stone-200 rounded-lg p-3 cursor-move hover:border-amber-400 hover:shadow-md transition-all ${
                isDragging ? 'opacity-50' : 'opacity-100'
            }`}
        >
            <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-amber-600" />
                <p className="font-semibold text-sm text-stone-900">{material.name}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500">
                <span>{material.stock_quantity ? material.stock_quantity.toLocaleString('fr-FR') : 0} {material.unit_name}</span>
                <span>{material.pmp ? material.pmp.toLocaleString('fr-FR') : 0} FCFA/{material.unit_name}</span>
            </div>
        </div>
    );
}

// Zone de formulation avec drop zone
function RecipeFormulator({
    ingredients,
    setIngredients,
    rawMaterials
}: {
    ingredients: RecipeIngredient[];
    setIngredients: React.Dispatch<React.SetStateAction<RecipeIngredient[]>>;
    rawMaterials: RawMaterial[];
}) {
    const { addToast } = useToasts();
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.RAW_MATERIAL,
        drop: (item: { material: RawMaterial }) => {
            // Vérifier si l'ingrédient existe déjà
            const exists = ingredients.find(ing => ing.ingredient_id === item.material.id);
            if (exists) {
                addToast({ message: 'Cet ingrédient est déjà dans la recette', type: 'error' });
                return;
            }

            setIngredients([
                ...ingredients,
                { id: Date.now().toString(), ingredient_id: item.material.id, quantity: 0 }
            ]);
            addToast({ message: `${item.material.name} ajouté à la recette`, type: 'success' });
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    }));

    const updateQuantity = (id: string, quantity: number) => {
        setIngredients(ingredients.map(ing =>
            ing.id === id ? { ...ing, quantity: Math.max(0, quantity) } : ing
        ));
    };

    const removeIngredient = (id: string) => {
        setIngredients(ingredients.filter(ing => ing.id !== id));
    };

    const totalQuantity = ingredients.reduce((sum, ing) => sum + (ing.quantity || 0), 0);
    const totalCost = ingredients.reduce((sum, ing) => {
        const material = rawMaterials.find(m => m.id === ing.ingredient_id);
        return sum + (material && material.pmp ? material.pmp * (ing.quantity || 0) : 0);
    }, 0);

    return (
        <div
            ref={drop as unknown as React.LegacyRef<HTMLDivElement>}
            className={`border-2 border-dashed rounded-xl p-6 min-h-[400px] transition-all ${
                isOver ? 'border-amber-500 bg-amber-50' : 'border-stone-300 bg-stone-50'
            }`}
        >
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-stone-700 uppercase">Formulation de la recette</h4>
                {ingredients.length === 0 && (
                    <p className="text-xs text-stone-500 italic">
                        👆 Glissez-déposez des ingrédients ici
                    </p>
                )}
            </div>

            <div className="space-y-3 mb-6">
                {ingredients.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ArrowRight className="w-8 h-8 text-stone-400 transform -rotate-90" />
                        </div>
                        <p className="text-sm text-stone-500">
                            Zone de formulation vide
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                            Ajoutez des ingrédients depuis la bibliothèque
                        </p>
                    </div>
                ) : (
                    ingredients.map((ingredient) => {
                        const material = rawMaterials.find(m => m.id === ingredient.ingredient_id);
                        if (!material) return null;

                        const cost = (material.pmp || 0) * (ingredient.quantity || 0);
                        const percentage = totalQuantity > 0 ? ((ingredient.quantity || 0) / totalQuantity) * 100 : 0;

                        return (
                            <div key={ingredient.id} className="bg-white border border-stone-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 flex-1">
                                        <GripVertical className="w-4 h-4 text-stone-400 cursor-move" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-stone-900">{material.name}</p>
                                            <div className="flex items-center gap-4 mt-1 text-xs text-stone-500">
                                                <span>
                                                    {percentage > 0 ? percentage.toFixed(1) : '0.0'}% de la recette
                                                </span>
                                                <span>•</span>
                                                <span>{cost.toLocaleString('fr-FR')} FCFA</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={ingredient.quantity || ''}
                                            onChange={(e) => updateQuantity(ingredient.id, parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="0.1"
                                            placeholder="0"
                                            className="w-24 px-3 py-2 border border-stone-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        />
                                        <span className="text-sm text-stone-600 w-8">{material.unit_name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeIngredient(ingredient.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Barre de progression */}
                                {percentage > 0 && (
                                    <div className="mt-3">
                                        <div className="w-full bg-stone-200 rounded-full h-1.5">
                                            <div
                                                className="bg-amber-500 h-1.5 rounded-full transition-all"
                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Résumé */}
            {ingredients.length > 0 && (
                <div className="border-t-2 border-stone-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Quantité totale:</span>
                        <span className="font-semibold text-stone-900">{totalQuantity.toLocaleString('fr-FR')} kg</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Coût total:</span>
                        <span className="font-semibold text-amber-600">{totalCost.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-stone-600">Coût par kg:</span>
                        <span className="font-bold text-stone-900">
                            {totalQuantity > 0 ? (totalCost / totalQuantity).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) : '0'} FCFA/kg
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Recipes({ recipes, rawMaterials = [], flash }: PageProps) {
    const { addToast } = useToasts();
    // Default to true for now since permissions are not clearly established in the props type
    const canManage = true;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        if (ingredients.length === 0) {
            addToast({ message: 'Ajoutez au moins un ingrédient', type: 'error' });
            return;
        }

        const totalQuantity = ingredients.reduce((sum, i) => sum + (i.quantity || 0), 0);

        if (totalQuantity === 0) {
            addToast({ message: 'Les quantités doivent être supérieures à zéro', type: 'error' });
            return;
        }

        // Utiliser router.post pour envoyer au backend
        router.post(route('recipes.store'), {
            code: formData.get('name')?.toString().substring(0, 6).toUpperCase() || 'REC',
            name: formData.get('name'),
            description: formData.get('description'),
            yield_quantity: totalQuantity,
            yield_unit: 'kg', // Par défaut
            is_active: true,
            ingredients: ingredients.map(ing => ({ ingredient_id: ing.ingredient_id, quantity: ing.quantity }))
        }, {
            onSuccess: () => {
                setShowCreateModal(false);
                setIngredients([]);
            }
        });
    };

    const handleDelete = (recipe: Recipe) => {
        if (confirm(`Supprimer la recette "${recipe.name}" ?`)) {
            router.delete(route('recipes.destroy', recipe.id));
        }
    };

    const calculateRecipeCost = (recipe: Recipe) => {
        // Fallback to backend total_cost if provided
        if (recipe.total_cost) return recipe.total_cost;

        return recipe.ingredients.reduce((sum, ing) => {
            const material = rawMaterials.find(m => m.id === ing.ingredient_id);
            return sum + (material && material.pmp ? material.pmp * ing.quantity : 0);
        }, 0);
    };

    // Fix pour le cas où l'API renvoie des pages paginées au lieu d'un array simple (si recipes.data existe)
    const recipesList = Array.isArray(recipes) ? recipes : (recipes as any).data || [];

    return (
        <AppLayout breadcrumbs={[{ title: 'Recettes', href: route('recipes.index') }]}>
            <Head title="Recettes d'aliments" />
            <DndProvider backend={HTML5Backend}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-stone-900">Recettes d'aliments</h2>
                            <p className="text-sm text-stone-500 mt-1">
                                Formulation des mélanges alimentaires
                            </p>
                        </div>
                        {canManage && (
                            <button
                                onClick={() => {
                                    setShowCreateModal(true);
                                    setIngredients([]);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Nouvelle recette
                            </button>
                        )}
                    </div>

                    {/* Liste des recettes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recipesList.length === 0 ? (
                            <div className="col-span-full bg-white border border-stone-200 rounded-xl p-12 text-center">
                                <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                <p className="text-sm text-stone-400">Aucune recette créée</p>
                            </div>
                        ) : (
                            recipesList.map((recipe: Recipe) => {
                                const cost = calculateRecipeCost(recipe);
                                const costPerKg = recipe.yield_quantity > 0 ? cost / recipe.yield_quantity : 0;

                                return (
                                    <div key={recipe.id} className="bg-white border border-stone-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                        <div className="p-5">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <h3 className="text-base font-semibold text-stone-900 mb-1">{recipe.name}</h3>
                                                    {recipe.description && (
                                                        <p className="text-xs text-stone-500">{recipe.description}</p>
                                                    )}
                                                </div>
                                                {canManage && (
                                                    <button
                                                        onClick={() => handleDelete(recipe)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-2 mb-4">
                                                {recipe.ingredients.map((ing, idx) => {
                                                    const material = rawMaterials.find(m => m.id === ing.ingredient_id);
                                                    const percentage = recipe.yield_quantity > 0 ? (ing.quantity / recipe.yield_quantity) * 100 : 0;

                                                    return (
                                                        <div key={idx} className="bg-stone-50 rounded-lg p-2">
                                                            <div className="flex items-center justify-between text-xs mb-1">
                                                                <span className="text-stone-700">{material ? material.name : 'Ingrédient Inconnu'}</span>
                                                                <span className="font-medium text-stone-900">
                                                                    {ing.quantity.toLocaleString('fr-FR')} {material ? material.unit_name : 'kg'}
                                                                </span>
                                                            </div>
                                                            <div className="w-full bg-stone-200 rounded-full h-1">
                                                                <div
                                                                    className="bg-amber-500 h-1 rounded-full"
                                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="border-t border-stone-100 pt-3 space-y-2">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-stone-500">Quantité totale:</span>
                                                    <span className="font-medium text-stone-900">{recipe.yield_quantity.toLocaleString('fr-FR')} kg</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-stone-500">Coût total:</span>
                                                    <span className="font-semibold text-amber-600">{cost.toLocaleString('fr-FR')} FCFA</span>
                                                </div>
                                                <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                                                    <span className="text-xs text-stone-500">Coût par kg:</span>
                                                    <span className="text-sm font-bold text-stone-900">{costPerKg.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Modal création avec drag & drop */}
                    {showCreateModal && (
                        <Modal title="Créer une recette" size="large" onClose={() => {
                            setShowCreateModal(false);
                            setIngredients([]);
                        }}>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Nom de la recette">
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            placeholder="Ex: Aliment pondeuse 18%"
                                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        />
                                    </Field>

                                    <Field label="Description (optionnel)">
                                        <input
                                            type="text"
                                            name="description"
                                            placeholder="Ex: Formule haute performance"
                                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                        />
                                    </Field>
                                </div>

                                <div className="grid grid-cols-5 gap-4">
                                    {/* Bibliothèque d'ingrédients */}
                                    <div className="col-span-2">
                                        <h4 className="text-xs font-semibold text-stone-700 uppercase mb-3">
                                            Bibliothèque d'ingrédients
                                        </h4>
                                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                            {rawMaterials.length === 0 ? (
                                                <p className="text-xs text-stone-400 text-center py-4">
                                                    Aucune matière première disponible
                                                </p>
                                            ) : (
                                                rawMaterials.map(material => (
                                                    <DraggableRawMaterial key={material.id} material={material} />
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Zone de formulation */}
                                    <div className="col-span-3">
                                        <RecipeFormulator
                                            ingredients={ingredients}
                                            setIngredients={setIngredients}
                                            rawMaterials={rawMaterials}
                                        />
                                    </div>
                                </div>

                                <ModalFooter
                                    onCancel={() => {
                                        setShowCreateModal(false);
                                        setIngredients([]);
                                    }}
                                    submitLabel="Créer la recette"
                                />
                            </form>
                        </Modal>
                    )}
                </div>
            </DndProvider>
        </AppLayout>
    );
}

function Modal({ title, size = 'normal', onClose, children }: {
    title: string;
    size?: 'normal' | 'large';
    onClose: () => void;
    children: React.ReactNode
}) {
    const maxWidth = size === 'large' ? 'max-w-5xl' : 'max-w-md';

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
                <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100 sticky top-0 bg-white z-10">
                    <h2 className="text-base font-semibold text-stone-900">{title}</h2>
                    <button type="button" onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
                        <span className="text-xl">×</span>
                    </button>
                </div>
                <div className="px-7 py-6">{children}</div>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function ModalFooter({ onCancel, submitLabel }: { onCancel: () => void; submitLabel: string }) {
    return (
        <div className="flex gap-3 pt-2 border-t border-stone-200 mt-6">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-50 transition-colors"
            >
                Annuler
            </button>
            <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm rounded-lg font-medium transition-colors bg-amber-500 hover:bg-amber-600 text-white"
            >
                {submitLabel}
            </button>
        </div>
    );
}
