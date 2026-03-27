import React, { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import {
    Plus, Edit2, Trash2, Eye, CheckCircle, XCircle, AlertCircle,
    ChevronLeft, ChevronRight, Search, ArrowDownCircle, ArrowUpCircle, Scale, Download
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { stockMovementsIndex, stockMovementsCreate, stockMovementsEdit, stockMovementsDestroy, stockMovementsApprove, stockMovementsReject, stockMovementsShow } from '@/routes';
import { formatCurrency } from '@/lib/utils';



// Types pour les mouvements de stock
type MovementType = 'in' | 'out' | 'adjust';
type MovementStatus = 'pending' | 'approved' | 'rejected';

interface StockMovement {
    id: number;
    ingredient: string;           // nom de l'ingrédient
    type: MovementType;
    quantity: number;
    unit: string;                  // symbole de l'unité
    unit_price: number | null;
    reason: string | null;
    status: MovementStatus;
    created_by: string;
    created_at: string;            // format d/m/Y H:i
    approved_by: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    // Permissions
    can_edit: boolean;
    can_delete: boolean;
    can_approve: boolean;
    can_reject: boolean;
}

interface PaginatedMovements {
    data: StockMovement[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface IngredientOption {
    id: number;
    name: string;
}

interface Filters {
    ingredient_id?: string;
    status?: string;
}

interface PageProps {
    movements: PaginatedMovements;
    ingredients: IngredientOption[];
    filters: Filters;
    flash?: { success?: string; error?: string };
}

const STATUS_META: Record<MovementStatus, { label: string; classes: string }> = {
    pending:  { label: 'En attente',  classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
    approved: { label: 'Approuvé',    classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    rejected: { label: 'Rejeté',      classes: 'bg-red-100 text-red-600 border border-red-200' },
};

const TYPE_META: Record<MovementType, { label: string; icon: any; color: string }> = {
    in:     { label: 'Entrée',  icon: 'ArrowDownCircle', color: 'text-green-600' },
    out:    { label: 'Sortie',  icon: 'ArrowUpCircle',   color: 'text-red-600' },
    adjust: { label: 'Ajustement', icon: 'Scale',        color: 'text-blue-600' },
};



// Types et constantes (définis ci-dessus)

export default function StockMovementsIndex({ movements, ingredients, filters, flash }: PageProps) {
    const { addToast } = useToasts();

    // États pour les filtres
    const [ingredientFilter, setIngredientFilter] = useState(filters.ingredient_id || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // États pour la modale d'approbation
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Notifications flash
    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const applyFilters = () => {
        router.get(stockMovementsIndex.url(), {
            ingredient_id: ingredientFilter || undefined,
            status: statusFilter || undefined,
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setIngredientFilter('');
        setStatusFilter('');
        router.get(stockMovementsIndex.url(), {}, { replace: true });
    };

    const handleDelete = (movement: StockMovement) => {
        if (!confirm(`Supprimer ce mouvement ?`)) return;
        router.delete(stockMovementsDestroy.url(movement.id));
    };

    const openApproveModal = (movement: StockMovement) => {
        setSelectedMovement(movement);
        setRejectionReason('');
        setShowApproveModal(true);
    };

    const handleApprove = () => {
        if (!selectedMovement) return;
        router.post(stockMovementsApprove.url(selectedMovement.id), {}, {
            onSuccess: () => {
                setShowApproveModal(false);
                setSelectedMovement(null);
            },
            onError: (err: any) => {
                addToast({ message: err.message || "Erreur lors de l'approbation", type: 'error' });
            },
        });
    };

    const handleReject = () => {
        if (!selectedMovement || !rejectionReason.trim()) return;
        router.post(stockMovementsReject.url(selectedMovement.id), {
            reason: rejectionReason,
        }, {
            onSuccess: () => {
                setShowApproveModal(false);
                setSelectedMovement(null);
                setRejectionReason('');
            },
            onError: (err: any) => {
                addToast({ message: err.message || "Erreur lors du rejet", type: 'error' });
            },
        });
    };

    // Helper pour l'icône de type
    const TypeIcon = ({ type }: { type: MovementType }) => {
        switch (type) {
            case 'in': return <ArrowDownCircle className="w-4 h-4 text-green-600" />;
            case 'out': return <ArrowUpCircle className="w-4 h-4 text-red-600" />;
            case 'adjust': return <Scale className="w-4 h-4 text-blue-600" />;
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Mouvements de stock', href: stockMovementsIndex.url() }]}>
            <Head title="Mouvements de stock" />
            <div className="min-h-screen bg-stone-50 font-sans">

                {/* En-tête */}
                <div className="bg-white border-b border-stone-200 px-8 py-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                                Mouvements de stock
                            </h1>
                            <p className="text-stone-500 text-sm mt-0.5">
                                {movements.total} mouvement{movements.total !== 1 ? 's' : ''} au total
                            </p>
                        </div>
                        <button
                            onClick={() => router.get(stockMovementsCreate.url())}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nouveau mouvement
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

                    {/* Filtres */}
                    <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
                        <div className="min-w-[200px]">
                            <label className="block text-xs text-stone-500 mb-1.5 font-medium">Ingrédient</label>
                            <select
                                value={ingredientFilter}
                                onChange={e => setIngredientFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                            >
                                <option value="">Tous les ingrédients</option>
                                {ingredients.map(i => (
                                    <option key={i.id} value={i.id}>{i.name}</option>
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
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Ingrédient</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Type</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Quantité</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Prix unit.</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Motif</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Statut</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {movements.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-5 py-12 text-center text-stone-400 text-sm">
                                                Aucun mouvement trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.data.map(m => {
                                            const sm = STATUS_META[m.status];
                                            return (
                                                <tr key={m.id} className="hover:bg-stone-50 transition-colors">
                                                    <td className="px-5 py-4 whitespace-nowrap text-stone-600">{m.created_at}</td>
                                                    <td className="px-5 py-4 font-medium text-stone-900">{m.ingredient}</td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <TypeIcon type={m.type} />
                                                            <span>{TYPE_META[m.type].label}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-stone-600">
                                                        {m.quantity} {m.unit}
                                                    </td>
                                                    <td className="px-5 py-4 text-stone-600">
                                                        {m.unit_price ? formatCurrency(m.unit_price) : '-'}
                                                    </td>
                                                    <td className="px-5 py-4 text-stone-600 max-w-[200px] truncate">
                                                        {m.reason || '-'}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${sm.classes}`}>
                                                            {sm.label}
                                                        </span>
                                                        {m.rejection_reason && (
                                                            <div className="text-xs text-red-600 mt-1" title={m.rejection_reason}>
                                                                {m.rejection_reason.substring(0, 20)}...
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
                                                                onClick={() => router.get(stockMovementsShow.url(m.id))}
                                                            />

                                                            {/* Modifier (can_edit) */}
                                                            {m.can_edit && (
                                                                <ActionButton
                                                                    icon={<Edit2 className="w-4 h-4" />}
                                                                    title="Modifier"
                                                                    colorClass="hover:text-amber-600 hover:bg-amber-50"
                                                                    onClick={() => router.get(stockMovementsEdit.url(m.id))}
                                                                />
                                                            )}

                                                            {/* Approuver / Rejeter (can_approve ou can_reject) */}
                                                            {(m.can_approve || m.can_reject) && (
                                                                <ActionButton
                                                                    icon={<AlertCircle className="w-4 h-4" />}
                                                                    title="Approuver / Rejeter"
                                                                    colorClass="hover:text-emerald-600 hover:bg-emerald-50"
                                                                    onClick={() => openApproveModal(m)}
                                                                />
                                                            )}

                                                            {/* Supprimer (can_delete) */}
                                                            {m.can_delete && (
                                                                <ActionButton
                                                                    icon={<Trash2 className="w-4 h-4" />}
                                                                    title="Supprimer"
                                                                    colorClass="hover:text-red-600 hover:bg-red-50"
                                                                    onClick={() => handleDelete(m)}
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
                        {movements.last_page > 1 && (
                            <div className="border-t border-stone-100 px-5 py-4 flex items-center justify-between text-sm text-stone-500">
                                <span>Page {movements.current_page} sur {movements.last_page} — {movements.total} résultats</span>
                                <div className="flex gap-1">
                                    <button
                                        disabled={movements.current_page === 1}
                                        onClick={() => router.get(stockMovementsIndex.url(), { ...filters, page: movements.current_page - 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={movements.current_page === movements.last_page}
                                        onClick={() => router.get(stockMovementsIndex.url(), { ...filters, page: movements.current_page + 1 })}
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
                {showApproveModal && selectedMovement && (
                    <Modal title="Décision sur le mouvement" onClose={() => setShowApproveModal(false)}>
                        <div className="space-y-3 mb-6 text-sm">
                            <InfoRow label="Ingrédient" value={selectedMovement.ingredient} />
                            <InfoRow label="Type" value={TYPE_META[selectedMovement.type].label} />
                            <InfoRow label="Quantité" value={`${selectedMovement.quantity} ${selectedMovement.unit}`} />
                            <InfoRow label="Prix unitaire" value={selectedMovement.unit_price ? formatCurrency(selectedMovement.unit_price) : '-'} />
                            <InfoRow label="Motif" value={selectedMovement.reason || '-'} />
                        </div>

                        {selectedMovement.can_reject && (
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
                            {selectedMovement.can_reject && (
                                <button
                                    onClick={handleReject}
                                    disabled={!rejectionReason.trim()}
                                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                                >
                                    <XCircle className="w-4 h-4" /> Rejeter
                                </button>
                            )}
                            {selectedMovement.can_approve && (
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
            <span className="text-stone-500 min-w-[100px] text-xs">{label} :</span>
            <span className="text-stone-900 font-medium text-sm">{value}</span>
        </div>
    );
}