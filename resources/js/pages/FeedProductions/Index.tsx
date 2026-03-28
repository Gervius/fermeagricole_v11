import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, CheckCircle, XCircle, Factory, Calendar, AlertTriangle } from 'lucide-react';
import { useToasts } from '@/components/ToastProvider';


// Interfaces matching the backend data
interface Production {
    id: string;
    recipeId: string;
    recipe_name: string;
    batchMultiplier: number;
    totalOutput: number;
    date: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
    notes: string | null;
    created_by: string;
    created_at: string;
    approved_by?: string;
    approved_at?: string;
    rejectionReason?: string;
    can_edit: boolean;
    can_delete: boolean;
    can_submit: boolean;
    can_approve: boolean;
    can_reject: boolean;
}

interface RawMaterial {
    id: string;
    name: string;
    currentStock: number;
    unit: string;
    unitPrice: number;
}

interface Recipe {
    id: string;
    name: string;
    outputQuantity: number;
    ingredients: { rawMaterialId: string; quantity: number }[];
}

interface PageProps {
    productions: Production[];
    recipes: Recipe[];
    rawMaterials: RawMaterial[];
    filters: any;
    flash?: { success?: string; error?: string };
}

const PRODUCTION_STATUS_META: Record<string, { label: string; classes: string }> = {
    draft: { label: 'Brouillon', classes: 'bg-stone-100 text-stone-700' },
    pending_approval: { label: 'En attente', classes: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approuvé', classes: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Rejeté', classes: 'bg-red-100 text-red-600' },
};

export default function ProductionsIndex({ productions, recipes, rawMaterials, filters, flash }: PageProps) {
    const { addToast } = useToasts();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Roles via permissions (from API 'can_create')
    // Fallback: we assume users have the capability globally to create if they can access the page.
    // Ideally this is sent from the backend too, but we simplify for UX mapping.
    const canCreate = true;

    React.useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const recipeId = formData.get('recipeId') as string;
        const batchMultiplier = parseFloat(formData.get('batchMultiplier') as string);
        const recipe = recipes.find(r => r.id === recipeId);

        if (!recipe) {
            addToast({ message: 'Recette introuvable', type: 'error' });
            return;
        }

        // Vérifier la disponibilité des matières premières
        const insufficientMaterials: string[] = [];
        recipe.ingredients.forEach(ingredient => {
            const material = rawMaterials.find(m => m.id === ingredient.rawMaterialId);
            const requiredQuantity = ingredient.quantity * batchMultiplier;
            if (material && material.currentStock < requiredQuantity) {
                insufficientMaterials.push(
                    `${material.name} (requis: ${requiredQuantity} ${material.unit}, disponible: ${material.currentStock} ${material.unit})`
                );
            }
        });

        if (insufficientMaterials.length > 0) {
            addToast({ message: `Stock insuffisant: ${insufficientMaterials.join(', ')}`, type: 'error' });
            return;
        }

        router.post(route('feed-productions.store'), {
            recipe_id: recipeId,
            quantity_produced: recipe.outputQuantity * batchMultiplier,
            production_date: formData.get('date'),
            notes: formData.get('notes'),
        }, {
            onSuccess: () => {
                setShowCreateModal(false);
            }
        });
    };

    const handleApprove = (production: Production) => {
        // Vérifier à nouveau la disponibilité avant d'approuver (double safety)
        const recipe = recipes.find(r => r.id === production.recipeId);
        if (!recipe) return;

        const insufficientMaterials: string[] = [];
        recipe.ingredients.forEach(ingredient => {
            const material = rawMaterials.find(m => m.id === ingredient.rawMaterialId);
            const requiredQuantity = ingredient.quantity * production.batchMultiplier;
            if (material && material.currentStock < requiredQuantity) {
                insufficientMaterials.push(`${material.name}`);
            }
        });

        if (insufficientMaterials.length > 0) {
            addToast({ message: `Stock insuffisant pour: ${insufficientMaterials.join(', ')}`, type: 'error' });
            return;
        }

        router.post(route('feed-productions.approve', production.id));
    };

    const handleReject = (productionId: string) => {
        if (!rejectionReason.trim()) return;

        router.post(route('feed-productions.reject', productionId), {
            rejection_reason: rejectionReason
        }, {
            onSuccess: () => {
                setRejectingId(null);
                setRejectionReason('');
            }
        });
    };

    const handleManualSubmit = (productionId: string) => {
        router.post(route('feed-productions.submit', productionId));
    };

    const handleDelete = (production: Production) => {
        if (confirm(`Voulez-vous vraiment supprimer cette production ?`)) {
            router.delete(route('feed-productions.destroy', production.id));
        }
    };

    // Statistiques
    const approvedProductions = productions.filter(p => p.status === 'approved');
    const totalOutput = approvedProductions.reduce((sum, p) => sum + p.totalOutput, 0);
    const pendingCount = productions.filter(p => p.status === 'pending_approval').length;

    return (
        <AppLayout breadcrumbs={[{ title: 'Productions', href: route('feed-productions.index') }]}>
            <Head title="Production d'aliments" />
            <div className="space-y-6 bg-stone-50 min-h-screen p-8 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-stone-900">Production d'aliments</h2>
                        <p className="text-sm text-stone-500 mt-1">
                            Fabrication et suivi des productions
                        </p>
                    </div>
                    {canCreate && recipes.length > 0 && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nouvelle production
                        </button>
                    )}
                </div>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Productions approuvées"
                        value={approvedProductions.length}
                        icon={CheckCircle}
                        color="emerald"
                    />
                    <StatCard
                        label="Aliment produit"
                        value={`${totalOutput.toLocaleString('fr-FR')} kg`}
                        icon={Factory}
                        color="blue"
                    />
                    <StatCard
                        label="En attente"
                        value={pendingCount}
                        icon={AlertTriangle}
                        color={pendingCount > 0 ? 'amber' : 'stone'}
                    />
                </div>

                {/* Liste des productions */}
                <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                {['Date', 'Recette', 'Quantité', 'Notes', 'Statut', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {productions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-stone-400 text-sm">
                                        Aucune production enregistrée
                                    </td>
                                </tr>
                            ) : (
                                productions.map(production => {
                                    const recipe = recipes.find(r => r.id === production.recipeId);
                                    const meta = PRODUCTION_STATUS_META[production.status] || PRODUCTION_STATUS_META['draft'];
                                    return (
                                        <tr key={production.id} className="hover:bg-stone-50">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2 text-stone-700">
                                                    <Calendar className="w-4 h-4 text-stone-400" />
                                                    {new Date(production.date).toLocaleDateString('fr-FR')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div>
                                                    <div className="font-medium text-stone-900">{recipe?.name || production.recipe_name}</div>
                                                    <div className="text-xs text-stone-500">
                                                        {production.batchMultiplier.toFixed(1)}x batch
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="font-medium text-stone-900">
                                                    {production.totalOutput.toLocaleString('fr-FR')} kg
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-stone-500 text-xs max-w-xs">
                                                {production.notes || '—'}
                                                {production.rejectionReason && (
                                                    <div className="text-red-600 mt-1 font-medium">
                                                        Motif: {production.rejectionReason}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${meta.classes}`}>
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1">
                                                    {/* Submit action */}
                                                    {production.can_submit && (
                                                        <button
                                                            onClick={() => handleManualSubmit(production.id)}
                                                            title="Soumettre pour approbation"
                                                            className="px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-xs font-medium transition-colors"
                                                        >
                                                            Soumettre
                                                        </button>
                                                    )}
                                                    {/* Approve/Reject actions */}
                                                    {production.status === 'pending_approval' && production.can_approve && (
                                                        <>
                                                            {rejectingId !== production.id ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleApprove(production)}
                                                                        title="Approuver"
                                                                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                                    >
                                                                        <CheckCircle className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setRejectingId(production.id)}
                                                                        title="Rejeter"
                                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="text"
                                                                        value={rejectionReason}
                                                                        onChange={e => setRejectionReason(e.target.value)}
                                                                        placeholder="Motif..."
                                                                        className="border border-stone-200 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleReject(production.id)}
                                                                        disabled={!rejectionReason.trim()}
                                                                        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-40 transition-colors"
                                                                    >
                                                                        OK
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setRejectingId(null);
                                                                            setRejectionReason('');
                                                                        }}
                                                                        className="text-stone-400 hover:text-stone-600"
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Détail des ingrédients pour les productions approuvées récentes */}
                {approvedProductions.length > 0 && (
                    <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden mt-8">
                        <div className="px-5 py-4 border-b border-stone-100 bg-stone-50">
                            <h3 className="text-base font-semibold text-stone-900">Détail des dernières productions</h3>
                        </div>
                        <div className="divide-y divide-stone-100">
                            {approvedProductions.slice(0, 5).map(production => {
                                const recipe = recipes.find(r => r.id === production.recipeId);
                                if (!recipe) return null;

                                return (
                                    <div key={production.id} className="px-5 py-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <div className="font-semibold text-stone-900">{recipe.name}</div>
                                                <div className="text-xs text-stone-500 mt-0.5">
                                                    {new Date(production.date).toLocaleDateString('fr-FR')} • {production.totalOutput} kg
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {recipe.ingredients.map((ingredient, idx) => {
                                                const material = rawMaterials.find(m => m.id === ingredient.rawMaterialId);
                                                const usedQuantity = ingredient.quantity * production.batchMultiplier;
                                                return (
                                                    <div key={idx} className="bg-stone-50 border border-stone-100 rounded-lg px-3 py-2.5">
                                                        <div className="text-xs text-stone-500 mb-1">{material?.name || 'Inconnu'}</div>
                                                        <div className="text-sm font-semibold text-stone-900">
                                                            {usedQuantity.toLocaleString('fr-FR')} kg
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Modal de création */}
                {showCreateModal && (
                    <Modal title="Nouvelle production" onClose={() => setShowCreateModal(false)}>
                        {recipes.length === 0 ? (
                            <div className="text-center py-6 text-stone-500 text-sm">
                                Créez d'abord une recette pour pouvoir lancer une production
                            </div>
                        ) : (
                            <>
                                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
                                    La production sera en attente de validation par le manager avant déduction des stocks.
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Field label="Recette">
                                        <select
                                            name="recipeId"
                                            required
                                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                        >
                                            <option value="">Sélectionner une recette</option>
                                            {recipes.map(r => (
                                                <option key={r.id} value={r.id}>
                                                    {r.name} ({r.outputQuantity} kg/batch)
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Nombre de batch">
                                        <input
                                            type="number"
                                            name="batchMultiplier"
                                            defaultValue={1}
                                            required
                                            min="0.1"
                                            step="0.1"
                                            placeholder="1"
                                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                        />
                                    </Field>

                                    <Field label="Date de production">
                                        <input
                                            type="date"
                                            name="date"
                                            defaultValue={new Date().toISOString().split('T')[0]}
                                            required
                                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                        />
                                    </Field>

                                    <Field label="Notes (optionnel)">
                                        <textarea
                                            name="notes"
                                            rows={2}
                                            placeholder="Observations..."
                                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white resize-none"
                                        />
                                    </Field>

                                    <ModalFooter
                                        onCancel={() => setShowCreateModal(false)}
                                        submitLabel="Créer la production"
                                    />
                                </form>
                            </>
                        )}
                    </Modal>
                )}
            </div>
        </AppLayout>
    );
}

// Composants réutilisables
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100">
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
        <div className="flex gap-3 pt-2">
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

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: 'emerald' | 'blue' | 'amber' | 'stone';
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-600',
        blue: 'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-600',
        stone: 'bg-stone-100 text-stone-600',
    };

    return (
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-xs text-stone-500 mb-1 font-medium uppercase tracking-wide">{label}</p>
                    <p className="text-2xl font-bold text-stone-900">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
