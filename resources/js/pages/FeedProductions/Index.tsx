import React, { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import {
    Plus, Edit2, Trash2, Eye, CheckCircle, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, Calendar, Send
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { feedProductionsIndex, feedProductionsCreate, feedProductionsEdit, feedProductionsDestroy, feedProductionsSubmit, feedProductionsApprove, feedProductionsReject, feedProductionsShow } from '@/routes';

// Types pour les productions d'aliments
type ProductionStatus = 'draft' | 'pending' | 'approved' | 'rejected';

interface FeedProduction {
    id: number;
    date: string;                    // Y-m-d
    recipe_name: string;
    recipe_id: number;
    quantity: number;
    unit: string;                    // unité de la recette (ex: kg)
    notes: string | null;
    status: ProductionStatus;
    created_by: string;
    created_at: string;              // d/m/Y H:i
    approved_by: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    // Permissions
    can_edit: boolean;
    can_delete: boolean;
    can_submit: boolean;             // pour soumettre à approbation (si draft)
    can_approve: boolean;
    can_reject: boolean;
}

interface PaginatedProductions {
    data: FeedProduction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface RecipeOption {
    id: number;
    name: string;
    yield_unit: string;
}

interface Filters {
    recipe_id?: string;
    status?: string;
}

interface PageProps {
    productions: PaginatedProductions;
    recipes: RecipeOption[];
    filters: Filters;
    flash?: { success?: string; error?: string };
}

const STATUS_META: Record<ProductionStatus, { label: string; classes: string }> = {
    draft:    { label: 'Brouillon',   classes: 'bg-slate-100 text-slate-600 border border-slate-200' },
    pending:  { label: 'En attente',  classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
    approved: { label: 'Approuvé',    classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    rejected: { label: 'Rejeté',      classes: 'bg-red-100 text-red-600 border border-red-200' },
};

// Types et constantes

export default function FeedProductionsIndex({ productions, recipes, filters, flash }: PageProps) {
    const { addToast } = useToasts();

    // États pour les filtres
    const [recipeFilter, setRecipeFilter] = useState(filters.recipe_id || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // États pour la modale d'approbation/rejet
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedProduction, setSelectedProduction] = useState<FeedProduction | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Notifications flash
    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const applyFilters = () => {
        router.get(feedProductionsIndex.url(), {
            recipe_id: recipeFilter || undefined,
            status: statusFilter || undefined,
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setRecipeFilter('');
        setStatusFilter('');
        router.get(feedProductionsIndex.url(), {}, { replace: true });
    };

    const handleDelete = (prod: FeedProduction) => {
        if (!confirm(`Supprimer cette production ?`)) return;
        router.delete(feedProductionsDestroy.url(prod.id));
    };

    const handleSubmit = (prod: FeedProduction) => {
        router.post(feedProductionsSubmit.url(prod.id), {}, {
            onError: (err: any) => addToast({ message: err.message || "Erreur lors de la soumission", type: 'error' }),
        });
    };

    const openApproveModal = (prod: FeedProduction) => {
        setSelectedProduction(prod);
        setRejectionReason('');
        setShowApproveModal(true);
    };

    const handleApprove = () => {
        if (!selectedProduction) return;
        router.post(feedProductionsApprove.url(selectedProduction.id), {}, {
            onSuccess: () => {
                setShowApproveModal(false);
                setSelectedProduction(null);
            },
            onError: (err: any) => {
                addToast({ message: err.message || "Erreur lors de l'approbation", type: 'error' });
            },
        });
    };

    const handleReject = () => {
        if (!selectedProduction || !rejectionReason.trim()) return;
        router.post(feedProductionsReject.url(selectedProduction.id), {
            reason: rejectionReason,
        }, {
            onSuccess: () => {
                setShowApproveModal(false);
                setSelectedProduction(null);
                setRejectionReason('');
            },
            onError: (err: any) => {
                addToast({ message: err.message || "Erreur lors du rejet", type: 'error' });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Productions d\'aliments', href: feedProductionsIndex.url() }]}>
            <Head title="Productions d'aliments" />
            <div className="min-h-screen bg-stone-50 font-sans">

                {/* En-tête */}
                <div className="bg-white border-b border-stone-200 px-8 py-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                                Productions d'aliments
                            </h1>
                            <p className="text-stone-500 text-sm mt-0.5">
                                {productions.total} production{productions.total !== 1 ? 's' : ''} au total
                            </p>
                        </div>
                        <button
                            onClick={() => router.get(feedProductionsCreate.url())}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nouvelle production
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

                    {/* Filtres */}
                    <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
                        <div className="min-w-[200px]">
                            <label className="block text-xs text-stone-500 mb-1.5 font-medium">Recette</label>
                            <select
                                value={recipeFilter}
                                onChange={e => setRecipeFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                            >
                                <option value="">Toutes les recettes</option>
                                {recipes.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="min-w-[160px]">
                            <label className="block text-xs text-stone-500 mb-1.5 font-medium">Statut</label>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                            >
                                <option value="">Tous les statuts</option>
                                <option value="draft">Brouillon</option>
                                <option value="pending">En attente</option>
                                <option value="approved">Approuvé</option>
                                <option value="rejected">Rejeté</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 transition-colors"
                            >
                                Filtrer
                            </button>
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 border border-stone-200 text-stone-600 text-sm rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    </div>

                    {/* Tableau */}
                    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-stone-100 bg-stone-50">
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Date</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Recette</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Quantité</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Créé par</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Statut</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {productions.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-5 py-12 text-center text-stone-400 text-sm">
                                                Aucune production trouvée.
                                            </td>
                                        </tr>
                                    ) : (
                                        productions.data.map(p => {
                                            const sm = STATUS_META[p.status];
                                            return (
                                                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                                                    <td className="px-5 py-4 whitespace-nowrap">
                                                        <span className="flex items-center gap-1.5 text-stone-600">
                                                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                                            {new Date(p.date).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 font-medium text-stone-900">{p.recipe_name}</td>
                                                    <td className="px-5 py-4 text-stone-600">{p.quantity} {p.unit}</td>
                                                    <td className="px-5 py-4 text-stone-600">{p.created_by}</td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${sm.classes}`}>
                                                            {sm.label}
                                                        </span>
                                                        {p.rejection_reason && (
                                                            <div className="text-xs text-red-600 mt-1" title={p.rejection_reason}>
                                                                {p.rejection_reason.substring(0, 20)}...
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1">
                                                            {/* Voir détail */}
                                                            <ActionButton
                                                                icon={<Eye className="w-4 h-4" />}
                                                                title="Voir le détail"
                                                                colorClass="hover:text-blue-600 hover:bg-blue-50"
                                                                onClick={() => router.get(feedProductionsShow.url(p.id))}
                                                            />

                                                            {/* Modifier (can_edit) */}
                                                            {p.can_edit && (
                                                                <ActionButton
                                                                    icon={<Edit2 className="w-4 h-4" />}
                                                                    title="Modifier"
                                                                    colorClass="hover:text-amber-600 hover:bg-amber-50"
                                                                    onClick={() => router.get(feedProductionsEdit.url(p.id))}
                                                                />
                                                            )}

                                                            {/* Soumettre (can_submit) */}
                                                            {p.can_submit && (
                                                                <ActionButton
                                                                    icon={<Send className="w-4 h-4" />}
                                                                    title="Soumettre pour approbation"
                                                                    colorClass="hover:text-indigo-600 hover:bg-indigo-50"
                                                                    onClick={() => handleSubmit(p)}
                                                                />
                                                            )}

                                                            {/* Approuver / Rejeter (can_approve ou can_reject) */}
                                                            {(p.can_approve || p.can_reject) && (
                                                                <ActionButton
                                                                    icon={<AlertCircle className="w-4 h-4" />}
                                                                    title="Approuver / Rejeter"
                                                                    colorClass="hover:text-emerald-600 hover:bg-emerald-50"
                                                                    onClick={() => openApproveModal(p)}
                                                                />
                                                            )}

                                                            {/* Supprimer (can_delete) */}
                                                            {p.can_delete && (
                                                                <ActionButton
                                                                    icon={<Trash2 className="w-4 h-4" />}
                                                                    title="Supprimer"
                                                                    colorClass="hover:text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleDelete(p)}
                                                                />
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

                        {/* Pagination */}
                        {productions.last_page > 1 && (
                            <div className="border-t border-stone-100 px-5 py-4 flex items-center justify-between text-sm text-stone-500">
                                <span>Page {productions.current_page} sur {productions.last_page} — {productions.total} résultats</span>
                                <div className="flex gap-1">
                                    <button
                                        disabled={productions.current_page === 1}
                                        onClick={() => router.get(feedProductionsIndex.url(), { ...filters, page: productions.current_page - 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={productions.current_page === productions.last_page}
                                        onClick={() => router.get(feedProductionsIndex.url(), { ...filters, page: productions.current_page + 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modale d'approbation/rejet */}
                {showApproveModal && selectedProduction && (
                    <Modal title="Décision sur la production" onClose={() => setShowApproveModal(false)}>
                        <div className="space-y-3 mb-6 text-sm">
                            <InfoRow label="Date" value={new Date(selectedProduction.date).toLocaleDateString('fr-FR')} />
                            <InfoRow label="Recette" value={selectedProduction.recipe_name} />
                            <InfoRow label="Quantité" value={`${selectedProduction.quantity} ${selectedProduction.unit}`} />
                            <InfoRow label="Créé par" value={selectedProduction.created_by} />
                            {selectedProduction.notes && (
                                <div className="text-stone-600 mt-1 text-xs italic">"{selectedProduction.notes}"</div>
                            )}
                        </div>

                        {selectedProduction.can_reject && (
                            <div className="mb-6">
                                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                                    Motif de rejet <span className="text-stone-400">(obligatoire)</span>
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    rows={3}
                                    placeholder="Expliquez la raison du rejet..."
                                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Annuler
                            </button>
                            {selectedProduction.can_reject && (
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectionReason.trim()}
                                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                    <XCircle className="w-4 h-4" /> Rejeter
                                </button>
                            )}
                            {selectedProduction.can_approve && (
                                <button
                                    onClick={handleApprove}
                                    className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                >
                                    <CheckCircle className="w-4 h-4" /> Approuver
                                </button>
                            )}
                        </div>
                    </Modal>
                )}
            </div>
        </AppLayout>
    );
}

// Sous-composants réutilisables (copiés des pages précédentes)
function ActionButton({ icon, title, colorClass, onClick }: any) {
    return (
        <button onClick={onClick} title={title} className={`p-1.5 rounded-lg text-stone-400 transition-colors ${colorClass}`}>
            {icon}
        </button>
    );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100">
                    <h2 className="text-base font-semibold text-stone-900">{title}</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-7 py-6">{children}</div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="text-stone-500 min-w-[80px] text-xs">{label} :</span>
            <span className="text-stone-900 font-medium text-sm">{value}</span>
        </div>
    );
}