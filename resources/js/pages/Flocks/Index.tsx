import { useState, useEffect } from 'react';
import { router, usePage, Head, useForm } from '@inertiajs/react';
import {
    Plus, Edit2, Trash2, Calendar, MapPin,
    ClipboardList, Send, CheckCircle, XCircle,
    AlertCircle, Eye, ChevronLeft, ChevronRight,
    Search, Filter
} from 'lucide-react';
import DailyRecords from './Partials/DailyRecords';
import { flocksApprove, flocksDestroy, flocksEdit, flocksReject, flocksShow, flocksStore, flocksSubmit, generation } from '@/routes';

import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';




// ─────────────────────────────────────────────
// Types alignés sur le contrôleur Laravel
// ─────────────────────────────────────────────

type FlockStatus = 'draft' | 'pending' | 'active' | 'rejected' | 'completed';
type RecordStatus = 'pending' | 'approved' | 'rejected';

/**
 * Permissions calculées côté Laravel (Policy).
 * Le contrôleur les inclut dans chaque objet flock via ->through().
 */
interface FlockPermissions {
    can_edit: boolean;
    can_delete: boolean;
    can_submit: boolean;
    can_approve: boolean;
    can_reject: boolean;
    can_end: boolean;
}

interface Flock extends FlockPermissions {
    id: number;
    name: string;
    building: string;
    arrival_date: string;      // format dd/MM/yyyy
    initial_quantity: number;
    current_quantity: number;
    status: FlockStatus;
    creator: string;
    // champs présents dans show() uniquement
    notes?: string;
    approver?: string;
    approved_at?: string;
}

interface DailyRecord {
    id: number;
    flock_id: number;
    date: string;
    losses: number;
    eggs: number;
    notes: string;
    status: RecordStatus;
    created_by: string;
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
}

interface PaginatedRecords {
    data: DailyRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Building {
    id: number;
    name: string;
}

interface Filters {
    status?: string;
    building_id?: string;
    search?: string;
}

interface PaginatedFlocks {
    data: Flock[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

// ─────────────────────────────────────────────
// Props de la page Inertia
// ─────────────────────────────────────────────

interface PageProps {
    flocks: PaginatedFlocks;
    buildings: Building[];
    recipes: { id: number, name: string }[];
    filters: Filters;
    flash?: { success?: string; error?: string };
    [key: string]: any;
}

// ─────────────────────────────────────────────
// Helpers statut
// ─────────────────────────────────────────────

const STATUS_META: Record<FlockStatus, { label: string; classes: string }> = {
    draft:     { label: 'Brouillon',   classes: 'bg-slate-100 text-slate-600 border border-slate-200' },
    pending:   { label: 'En attente',  classes: 'bg-amber-100 text-amber-700 border border-amber-200' },
    active:    { label: 'Actif',       classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    rejected:  { label: 'Rejeté',      classes: 'bg-red-100 text-red-600 border border-red-200' },
    completed: { label: 'Terminé',     classes: 'bg-slate-100 text-slate-500 border border-slate-200' },
};

const RECORD_STATUS_META: Record<RecordStatus, { label: string; classes: string }> = {
    pending:  { label: 'En attente', classes: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approuvé',   classes: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Rejeté',     classes: 'bg-red-100 text-red-600' },
};

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────

export default function FlockManagement({flocks, buildings, filters, flash, recipes = []}: PageProps) {
    //const { flocks, buildings, filters, flash, errors } = usePage<PageProps>().props;

    // ── État local (UI uniquement) ──────────────
    const [showCreateModal,  setShowCreateModal]  = useState(false);
    const [showDetailModal,  setShowDetailModal]  = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showTrackingModal,setShowTrackingModal]= useState(false);
    const [showDailyForm,    setShowDailyForm]    = useState(false);
    const [showEndFlockModal, setShowEndFlockModal] = useState(false);

    const [selectedFlock,  setSelectedFlock]  = useState<Flock | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [endReason, setEndReason] = useState<'sale' | 'mortality' | 'disease' | 'other'>('sale');
    const [endNotes, setEndNotes] = useState('');


    const [endSaleDate, setEndSaleDate] = useState('');
    const [endSalePrice, setEndSalePrice] = useState('');
    const [endSaleCustomer, setEndSaleCustomer] = useState('');
    const [endSaleInvoiceRef, setEndSaleInvoiceRef] = useState('');
    //initialise un état local avec les données reçues d'Inertia,
    // pour permettre des interactions locales (ex : filtres côté client avant soumission)
    const [localFlocks, setLocalFlocks] = useState<Flock[]>(flocks.data);
    //synchronise si Inertia rafraîchit la page entière (ex: changement de page)
    useEffect(() => {
        setLocalFlocks(flocks.data);
    }, [flocks.data]);

    const handleFlockUpdate = (updatedData: { id: number, current_quantity: number }) => {
        setLocalFlocks((currentFlocks: any[]) =>
            currentFlocks.map(f =>
                f.id === updatedData.id
                    ? { ...f, current_quantity: updatedData.current_quantity }
                    : f
            )
        );
    };

    // Formulaires
    /*
    const [createForm, setCreateForm] = useState({
        name: '', arrival_date: '', initial_quantity: '', building_id: '',
    });
    */
    const { data, setData, post, patch, get, processing, errors } = useForm({name: '', arrival_date: '', initial_quantity: '', building_id: '',})


    const { addToast } = useToasts();

    useEffect(() => {
        if (flash?.success) {
            addToast({ message: String(flash.success), type: 'success' });
        }
        if (flash?.error) {
            addToast({ message: String(flash.error), type: 'error' });
        }
        if (errors && Object.keys(errors).length > 0) {
            const msg = Object.entries(errors).map(([k, v]) => Array.isArray(v) ? v.join(' ') : String(v)).join(' ');
            addToast({ message: msg, type: 'error' });
        }

    }, []);

    // Recherche / filtres locaux (soumis via Inertia GET)
    const [searchValue,   setSearchValue]   = useState(filters.search ?? '');
    const [statusFilter,  setStatusFilter]  = useState(filters.status ?? '');
    const [buildingFilter,setBuildingFilter]= useState(filters.building_id ?? '');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // ── Helpers ────────────────────────────────

    const applyFilters = () => {
        router.get(generation.url(), {
            search:      searchValue   || undefined,
            status:      statusFilter  || undefined,
            building_id: buildingFilter|| undefined,
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setSearchValue('');
        setStatusFilter('');
        setBuildingFilter('');
        router.get(generation.url(), {}, { replace: true });
    };

    // ── Actions Inertia ─────────────────────────

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post(flocksStore.url(), {
            onSuccess: () => {
                setShowCreateModal(false);
                setData({ name: '', arrival_date: '', initial_quantity: '', building_id: '' });
            },
        });
    };

    const handleDelete = (flock: Flock) => {
        if (!confirm(`Supprimer le lot "${flock.name}" ?`)) return;
        router.delete(flocksDestroy.url(flock.id));
    };

    const handleSubmitForApproval = (flock: Flock) => {
        patch(flocksSubmit.url(flock.id), {
            onError: (err: any) => setErrorMessage(err?.message || 'Erreur lors de la soumission.'),
        });
    };

    const handleApprove = () => {
        if (!selectedFlock) return;
        patch(flocksApprove.url(selectedFlock.id), {
            onSuccess: () => { setShowApproveModal(false); setSelectedFlock(null); },
            onError: (err: any) => {
              console.log('Erreur approve :', err);
              let message = "Erreur lors de l'approbation.";
              if (err.message) {
                  message = err.message;
              } else if (err.building) {
                  message = err.building;
              } else {
                  // essayer de concaténer toutes les valeurs
                  message = Object.values(err).join(' ');
              }
              setErrorMessage(message);
              addToast({ message, type: 'error', duration: 5000 });
            },
        });
    };

    const handleReject = () => {
        if (!selectedFlock || !rejectionReason.trim()) return;
        router.patch(flocksReject.url(selectedFlock.id),   {
            reason: rejectionReason,
        },  {

            onSuccess: () => { setShowApproveModal(false); setSelectedFlock(null); setRejectionReason(''); },
            onError: (err: any) => {
                setErrorMessage(err?.message || 'Erreur lors du rejet.');
                addToast({ message: err?.message || 'Erreur lors du rejet.', type: 'error', duration: 4000 });
            },
        });
    };

    /** 
    const handleFlockUpdate = (updatedFlock: Flock) => {
        setData(prev => ({ ...prev, data: prev.data.map(f => f.id === updatedFlock.id ? updatedFlock : f) }));
    };
    */

    const openApproveModal = (flock: Flock) => {
        setSelectedFlock(flock);
        setRejectionReason('');
        setShowApproveModal(true);
    };

    const openTracking = (flock: Flock) => {
        setSelectedFlock(flock);
        setShowTrackingModal(true);
    };

    const openEndFlockModal = (flock: Flock) => {
        setSelectedFlock(flock);
        setEndReason('sale');
        setEndNotes('');
        setShowEndFlockModal(true);
    };

    const handleEndFlock = () => {
        if (!selectedFlock) return;
        const data: any = {
            end_reason: endReason,
            notes: endNotes,
        };
        if (endReason === 'sale') {
            data.sale_date = endSaleDate;
            data.sale_price = endSalePrice;
            data.sale_customer = endSaleCustomer || null;
            data.sale_invoice_ref = endSaleInvoiceRef || null;
        }
        router.post(`/flocks/${selectedFlock.id}/end`, data, {
            onSuccess: () => {
                setShowEndFlockModal(false);
                setSelectedFlock(null);
                setEndReason('sale');
                setEndNotes('');
                setEndSaleDate('');
                setEndSalePrice('');
                setEndSaleCustomer('');
                setEndSaleInvoiceRef('');
            },
            onError: (errors: any) => {
                setErrorMessage(errors.message || 'Erreur lors de la terminaison du lot');
                addToast({ message: errors.message || 'Erreur lors de la terminaison du lot', type: 'error', duration: 4000 });
            },
        });
    };

    // Daily records are managed by the DailyRecords partial (server-backed)

    // ── Render ──────────────────────────────────

    return (
      <AppLayout>
        <Head title="Générations" />
        <div className="min-h-screen bg-stone-50 font-sans">

            {/* Server flashes rendered as toasts by ToastProvider */}

            {/* ── Header ── */}
            <div className="bg-white border-b border-stone-200 px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                            Gestion des lots
                        </h1>
                        <p className="text-stone-500 text-sm mt-0.5">
                            {flocks.total} lot{flocks.total !== 1 ? 's' : ''} au total
                        </p>
                    </div>
                    {/* Le bouton "Nouveau lot" s'affiche si au moins un flock est créable,
                        ou on peut laisser visible en permanence — le backend bloquera si besoin.
                        Ici on l'affiche toujours et le store() vérifie la Policy. */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Nouveau lot
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

                {/* ── Filtres ── */}
                <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs text-stone-500 mb-1.5 font-medium">Recherche</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input
                                type="text"
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                placeholder="Nom du lot..."
                                className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                    </div>
                    <div className="min-w-[160px]">
                        <label className="block text-xs text-stone-500 mb-1.5 font-medium">Statut</label>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                        >
                            <option value="">Tous les statuts</option>
                            {Object.entries(STATUS_META).map(([key, { label }]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="min-w-[160px]">
                        <label className="block text-xs text-stone-500 mb-1.5 font-medium">Bâtiment</label>
                        <select
                            value={buildingFilter}
                            onChange={e => setBuildingFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                        >
                            <option value="">Tous les bâtiments</option>
                            {buildings.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
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

                {/* ── Tableau ── */}
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-stone-100 bg-stone-50">
                                    {['Lot', 'Bâtiment', 'Arrivée', 'Effectif', 'Créateur', 'Statut', 'Actions'].map(h => (
                                        <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {flocks.data.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-stone-400 text-sm">
                                            Aucun lot trouvé.
                                        </td>
                                    </tr>
                                )}
                                {/* Utilise localFlocks au lieu de flocks.data pour ton tableau */}
                                {localFlocks
                                    .filter((flock: { status: string; }) => statusFilter ? true : flock.status !== 'completed')
                                    .map((flock: Flock) => {
                                        const sm = STATUS_META[flock.status];
                                        return (
                                            <tr key={flock.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-5 py-4 font-medium text-stone-900">{flock.name}</td>
                                            <td className="px-5 py-4">
                                                <span className="flex items-center gap-1.5 text-stone-600">
                                                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                                                    {flock.building}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="flex items-center gap-1.5 text-stone-600">
                                                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                                    {flock.arrival_date}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-stone-900">{flock.current_quantity.toLocaleString('fr-FR')}</span>
                                                <span className="text-stone-400 text-xs ml-1">/ {flock.initial_quantity.toLocaleString('fr-FR')}</span>
                                            </td>
                                            <td className="px-5 py-4 text-stone-600">{flock.creator}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${sm.classes}`}>
                                                    {sm.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {/* ─────────────────────────────────────────
                                                    PERMISSIONS : directement depuis Laravel Policy
                                                    Chaque bouton est conditionné par can_* du flock.
                                                    Aucune logique de rôle côté client.
                                                ───────────────────────────────────────── */}
                                                <div className="flex items-center gap-1">

                                                    {/* Voir le détail : toujours visible */}
                                                    <ActionButton
                                                        icon={<Eye className="w-4 h-4" />}
                                                        title="Voir le détail"
                                                        colorClass="hover:text-blue-600 hover:bg-blue-50"
                                                        onClick={() => router.get(flocksShow.url(flock.id))}
                                                    />

                                                    {/* Modifier (can_edit) */}
                                                    {flock.can_edit && (
                                                        <ActionButton
                                                            icon={<Edit2 className="w-4 h-4" />}
                                                            title="Modifier"
                                                            colorClass="hover:text-amber-600 hover:bg-amber-50"
                                                            onClick={() => router.get(flocksEdit.url(flock.id))}
                                                        />
                                                    )}

                                                    {/* Soumettre (can_submit) */}
                                                    {flock.can_submit && (
                                                        <ActionButton
                                                            icon={<Send className="w-4 h-4" />}
                                                            title="Soumettre pour approbation"
                                                            colorClass="hover:text-indigo-600 hover:bg-indigo-50"
                                                            onClick={() => handleSubmitForApproval(flock)}
                                                        />
                                                    )}

                                                    {/* Approuver / Rejeter (can_approve ou can_reject) */}
                                                    {(flock.can_approve || flock.can_reject) && (
                                                        <ActionButton
                                                            icon={<AlertCircle className="w-4 h-4" />}
                                                            title="Approuver / Rejeter"
                                                            colorClass="hover:text-emerald-600 hover:bg-emerald-50"
                                                            onClick={() => openApproveModal(flock)}
                                                        />
                                                    )}

                                                    {/* Suivi journalier : disponible si le lot est actif */}
                                                    {flock.status === 'active' && (
                                                        <ActionButton
                                                            icon={<ClipboardList className="w-4 h-4" />}
                                                            title="Suivi journalier"
                                                            colorClass="hover:text-stone-900 hover:bg-stone-100"
                                                            onClick={() => openTracking(flock)}
                                                        />
                                                    )}

                                                    {/* Terminer ce lot : disponible si le lot est actif */}
                                                    {flock.status === 'active' && flock.can_end && (
                                                        <ActionButton
                                                            icon={<XCircle className="w-4 h-4" />}
                                                            title="Terminer ce lot"
                                                            colorClass="hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => openEndFlockModal(flock)}
                                                        />
                                                    )}

                                                    {/* Supprimer (can_delete) */}
                                                    {flock.can_delete && (
                                                        <ActionButton
                                                            icon={<Trash2 className="w-4 h-4" />}
                                                            title="Supprimer"
                                                            colorClass="hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleDelete(flock)}
                                                        />
                                                    )}

                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Pagination ── */}

                    {flocks.last_page && flocks.last_page > 1 && (
                        <div className="border-t border-stone-100 px-5 py-4 flex items-center justify-between text-sm text-stone-500">
                            <span>Page {flocks.current_page} sur {flocks.last_page} — {flocks.total} résultats</span>
                            <div className="flex gap-1">
                                <button
                                    disabled={flocks.current_page === 1}
                                    onClick={() => router.get(generation.url(), { ...filters, page: flocks.current_page - 1 })}
                                    className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    disabled={flocks.current_page === flocks.last_page}
                                    onClick={() => router.get(generation.url(), { ...filters, page: flocks.current_page + 1 })}
                                    className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                MODALES
            ══════════════════════════════════════════════ */}

            {/* ── Créer un lot ── */}
            {showCreateModal && (
                <Modal title="Nouveau lot" onClose={() => setShowCreateModal(false)}>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Field label="Nom du lot">
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData({ ...data, name: e.target.value })}
                                placeholder="Ex : G-2024-03"
                                required
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Date d'arrivée">
                            <input
                                type="date"
                                value={data.arrival_date}
                                onChange={e => setData({ ...data, arrival_date: e.target.value })}
                                required
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Quantité initiale">
                            <input
                                type="number"
                                value={data.initial_quantity}
                                onChange={e => setData({ ...data, initial_quantity: e.target.value })}
                                placeholder="Ex : 5000"
                                min="1"
                                required
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Bâtiment">
                            <select
                                value={data.building_id}
                                onChange={e => setData({ ...data, building_id: e.target.value })}
                                required
                                className={inputClass}
                            >
                                <option value="">Sélectionner un bâtiment</option>
                                {buildings.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </Field>
                        <ModalFooter
                            onCancel={() => setShowCreateModal(false)}
                            submitLabel="Créer en brouillon"
                            submitClass="bg-amber-500 hover:bg-amber-600 text-white"
                        />
                    </form>
                </Modal>
            )}

            {/* ── Approuver / Rejeter ── */}
            {showApproveModal && selectedFlock && (
              <Modal title="Décision d'approbation" onClose={() => setShowApproveModal(false)}>
                  <div className="space-y-3 mb-6 text-sm">
                      <InfoRow label="Lot"        value={selectedFlock.name} />
                      <InfoRow label="Bâtiment"   value={selectedFlock.building} />
                      <InfoRow label="Effectif"   value={selectedFlock.initial_quantity.toLocaleString('fr-FR')} />
                      <InfoRow label="Créé par"   value={selectedFlock.creator} />
                  </div>

                  {selectedFlock.can_reject && (
                      <div className="mb-6">
                          <label className="block text-xs font-medium text-stone-600 mb-1.5">
                              Motif de rejet <span className="text-stone-400">(obligatoire si rejeté)</span>
                          </label>
                          <textarea
                              value={rejectionReason}
                              onChange={e => setRejectionReason(e.target.value)}
                              rows={3}
                              placeholder="Expliquez la raison du rejet..."
                              className={`${inputClass} resize-none`}
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
                      {selectedFlock.can_reject && (
                          <button
                              onClick={handleReject}
                              disabled={!rejectionReason.trim()}
                              className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                              <XCircle className="w-4 h-4" /> Rejeter
                          </button>
                      )}
                      {selectedFlock.can_approve && (
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

            {/* ── Suivi journalier ── */}
            {showTrackingModal && selectedFlock && (
                <Modal
                    title={`Suivi journalier — ${selectedFlock.name}`}
                    onClose={() => { setShowTrackingModal(false); setSelectedFlock(null); }}
                    wide
                >
                        <div>
                            <DailyRecords initialFlock={selectedFlock!} onClose={() => setShowTrackingModal(false)} onFlockUpdate={handleFlockUpdate} recipes={recipes} />
                        </div>
                </Modal>
            )}


            {/* ── Terminer un lot ── */}
            {showEndFlockModal && selectedFlock && (
                <Modal
                    title={`Terminer le lot — ${selectedFlock.name}`}
                    onClose={() => setShowEndFlockModal(false)}
                    wide // utiliser le mode large pour avoir plus de place
                >
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                            <strong>Attention :</strong> Terminer ce lot permettra l'activation d'un autre lot dans le même bâtiment.
                        </div>

                        <Field label="Raison de fin">
                            <select
                                value={endReason}
                                onChange={(e) => {
                                    const newReason = e.target.value as 'sale' | 'mortality' | 'disease' | 'other';
                                    setEndReason(newReason);
                                    // Optionnel : pré-remplir sale_date avec la date du jour
                                    if (newReason === 'sale' && !endSaleDate) {
                                        setEndSaleDate(new Date().toISOString().split('T')[0]);
                                    }
                                }}
                                className={inputClass}
                            >
                                <option value="sale">Vente</option>
                                <option value="mortality">Mortalité</option>
                                <option value="disease">Maladie</option>
                                <option value="other">Autre</option>
                            </select>
                        </Field>

                        {/* Champs supplémentaires pour la vente */}
                        {endReason === 'sale' && (
                            <>
                                <Field label="Date de vente *">
                                    <input
                                        type="date"
                                        value={endSaleDate}
                                        onChange={(e) => setEndSaleDate(e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </Field>
                                <Field label="Prix de vente (FCFA) *">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={endSalePrice}
                                        onChange={(e) => setEndSalePrice(e.target.value)}
                                        className={inputClass}
                                        placeholder="0.00"
                                        required
                                    />
                                </Field>
                                <Field label="Client">
                                    <input
                                        type="text"
                                        value={endSaleCustomer}
                                        onChange={(e) => setEndSaleCustomer(e.target.value)}
                                        className={inputClass}
                                        placeholder="Nom du client"
                                    />
                                </Field>
                                <Field label="Référence facture">
                                    <input
                                        type="text"
                                        value={endSaleInvoiceRef}
                                        onChange={(e) => setEndSaleInvoiceRef(e.target.value)}
                                        className={inputClass}
                                        placeholder="FAC-2025-001"
                                    />
                                </Field>
                            </>
                        )}

                        <Field label="Notes additionnelles (optionnel)">
                            <textarea
                                value={endNotes}
                                onChange={(e) => setEndNotes(e.target.value)}
                                placeholder="Commentaires supplémentaires..."
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                        </Field>

                        <div className="flex gap-3 pt-3">
                            <button
                                onClick={() => setShowEndFlockModal(false)}
                                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleEndFlock}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                                <CheckCircle className="w-4 h-4" /> Terminer ce lot
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* DailyForms rendered inside DailyRecords component */}
        </div>
      </AppLayout>
    );
}

// ─────────────────────────────────────────────
// Sous-composants utilitaires
// ─────────────────────────────────────────────

const inputClass =
    'w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white';

function ActionButton({
    icon, title, colorClass, onClick,
}: {
    icon: React.ReactNode; title: string; colorClass: string; onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded-lg text-stone-400 transition-colors ${colorClass}`}
        >
            {icon}
        </button>
    );
}

function Modal({
    title, onClose, children, wide = false,
}: {
    title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div
                className={`bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${wide ? 'max-w-3xl' : 'max-w-md'}`}
            >
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="text-stone-500 min-w-[80px]">{label} :</span>
            <span className="text-stone-900 font-medium">{value}</span>
        </div>
    );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="text-xs text-stone-500 mb-1">{label}</div>
            <div className="text-xl font-semibold text-stone-900">{value}</div>
        </div>
    );
}

function ModalFooter({
    onCancel, submitLabel, submitClass,
}: {
    onCancel: () => void; submitLabel: string; submitClass: string;
}) {
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
                className={`flex-1 px-4 py-2 text-sm rounded-lg font-medium transition-colors ${submitClass}`}
            >
                {submitLabel}
            </button>
        </div>
    );
}

/**
 * Boutons inline d'approbation d'un enregistrement journalier.
 * On peut raffiner avec un mini-modal pour la raison de rejet.
 */
function RecordApprovalButtons({
    onApprove, onReject,
}: {
    onApprove: () => void;
    onReject: (reason: string) => void;
}) {
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState('');

    if (rejecting) {
        return (
            <div className="flex items-center gap-1">
                <input
                    type="text"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Motif..."
                    className="border border-stone-200 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                    onClick={() => { if (reason.trim()) { onReject(reason); setRejecting(false); } }}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                >
                    OK
                </button>
                <button onClick={() => setRejecting(false)} className="text-stone-400 hover:text-stone-600">
                    <XCircle className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={onApprove}
                title="Approuver"
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
            >
                <CheckCircle className="w-4 h-4" />
            </button>
            <button
                onClick={() => setRejecting(true)}
                title="Rejeter"
                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
            >
                <XCircle className="w-4 h-4" />
            </button>
        </div>
    );
}
