import React, { useState, useEffect } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import { useToasts } from '@/components/ToastProvider';
import {
    Plus, CheckCircle, XCircle,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { suivieStore, suivieApprove, suivieReject, flocksDailyRecords } from '@/routes';


type RecordStatus = 'pending' | 'approved' | 'rejected';
interface DailyRecord {
    id: number;
    flock_id: number;
    date: string;
    losses: number;
    eggs: number;
    feed_type_name?: string | null;
    feed_consumed?: number | null;
    water_consumed?: number | null;
    avg_feed_per_bird?: number | null;
    avg_water_per_bird?: number | null;
    theoretical_norm?: { feed: number; water: number } | null;
    notes: string;
    status: RecordStatus;
    created_by: string;
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
    can_approve?: boolean;
    can_reject?: boolean;
}
interface Flock { id: number; name: string; }

interface DailyRecordProps {
    initialFlock?: Flock;
    onClose: () => void;
    onFlockUpdate: (data: { id: number, current_quantity: number }) => void;
}

interface PaginatedRecords {
    data: DailyRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
interface Recipe {
    id: number;
    name: string;
}

interface PageProps {
    dailyRecords?: PaginatedRecords;
    recipes?: Recipe[];
    flash?: {
        newRecord?: DailyRecord;
        updatedRecord?: Partial<DailyRecord> & { id: number };
        success?: string;
        error?: string;
    };
}
const RECORD_STATUS_META: Record<RecordStatus, { label: string; classes: string }> = {
    pending:  { label: 'En attente', classes: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Approuvé',   classes: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Rejeté',     classes: 'bg-red-100 text-red-600' },
};

export default function DailyRecords({ initialFlock, onClose, onFlockUpdate, recipes: externalRecipes }: { initialFlock?: Flock, onClose: () => void, onFlockUpdate: (data: { id: number, current_quantity: number }) => void, recipes?: Recipe[]  }) {
    const { props } = usePage<PageProps>(); // on garde pour les autres usages si besoin, mais on n'y fait pas directement dans onSuccess
    const flock = initialFlock;
    const { addToast } = useToasts();

    // État local
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDailyForm, setShowDailyForm] = useState(false);
    const { data, setData, post } = useForm({
        flock_id: flock?.id ?? null,
        date: new Date().toISOString().split('T')[0],
        losses: '',
        eggs: '',
        feed_type_id: '',
        feed_consumed: '',
        water_consumed: '',
        notes: ''
    });
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const recipes = externalRecipes || props.recipes || [];

    // Chargement initial
    const loadRecords = (page = 1) => {
        if (!flock) return;
        setLoading(true);
        setError(null);
        router.reload({
            only: ['dailyRecords', 'recipes'],
            data: { flock_id: flock.id, records_page: page },
            preserveState: true,
            preserveScroll: true,
            onSuccess: (pageObj) => {
                const data = (pageObj.props as PageProps).dailyRecords;
                if (data) {
                    setRecords(data.data);
                    setPagination({
                        current_page: data.current_page,
                        last_page: data.last_page,
                        total: data.total,
                    });
                }
                setLoading(false);
            },
            onError: (errors) => {
                console.error(errors);
                setError('Impossible de charger les données');
                setLoading(false);
            },
        });
    };

    useEffect(() => {
        if (flock) loadRecords();
    }, [flock]);

    // ── Actions avec récupération directe depuis la réponse ──

    const handleDailySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(suivieStore.url(), {
            preserveState: true,
            only: ['flash'], // On demande uniquement les nouvelles données flash
            onSuccess: (page) => {
                const newRecord = (page.props as PageProps).flash?.newRecord;
                if (newRecord) {
                    setRecords(prev => [newRecord, ...prev]);
                    setPagination(prev => ({ ...prev, total: prev.total + 1 }));
                }
                setShowDailyForm(false);
                setData({ flock_id: flock?.id ?? null, date: new Date().toISOString().split('T')[0], losses: '', eggs: '', feed_type_id: '', feed_consumed: '', water_consumed: '', notes: '' });
                addToast({ message: 'Suivi créé avec succès', type: 'success' });
            },
            onError: (errors) => {
                console.log(errors);
                addToast({ message: 'Veuillez vérifier le formulaire', type: 'error' });
            },
        });
    };

    const handleApprove = (recordId: number) => {
        router.post(suivieApprove.url(recordId), {}, {
            preserveState: true,
            only: ['flash'],
            onSuccess: (page) => {
                const updatedFlock = page.props.flash?.updatedFlock;
                if (updatedFlock) {
                    onFlockUpdate(updatedFlock);
                }
                addToast({ message: 'Suivi approuvé', type: 'success' });
                // Recharger la page courante des enregistrements
                loadRecords(pagination.current_page);
            },
            onError: (errors) => {
                console.log(errors);
                addToast({ message: 'Erreur lors de l\'approbation', type: 'error' });
            },
        });
    };

    const handleReject = (recordId: number) => {
        if (!rejectionReason.trim()) return;
        router.post(suivieReject.url(recordId), { reason: rejectionReason }, {
            preserveState: true,
            only: ['flash'],
            onSuccess: (page) => {
                const updated = (page.props as PageProps).flash?.updatedRecord;
                if (updated) {
                    setRecords(prev =>
                        prev.map(r => (r.id === updated.id ? { ...r, ...updated } : r))
                    );
                }
                setRejectingId(null);
                setRejectionReason('');
                addToast({ message: 'Suivi rejeté', type: 'success' });
            },
            onError: (errors) => {
                console.log(errors);
                addToast({ message: 'Erreur lors du rejet', type: 'error' });
            },
        });
    };

    const goToPage = (page: number) => loadRecords(page);

    // Stats (inchangé)
    const approvedRecords = records.filter(r => r.status === 'approved');
    const stats = {
        totalLosses: approvedRecords.reduce((s, r) => s + r.losses, 0),
        avgEggs: approvedRecords.length ? Math.round(approvedRecords.reduce((s, r) => s + r.eggs, 0) / approvedRecords.length) : 0,
        count: approvedRecords.length,
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-100 rounded">
                    {error}
                </div>
            )}

            <div>
                <button
                    onClick={() => setShowDailyForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" /> Nouveau suivi
                </button>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                            {['Date', 'Pertes', 'Œufs', 'Aliment', 'Eau', 'Notes', 'Statut', 'Actions'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {records.length === 0 && !loading && (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-stone-400 text-sm">
                                    Aucun enregistrement.
                                </td>
                            </tr>
                        )}
                        {records.map(record => {
                            const rsm = RECORD_STATUS_META[record.status];
                            return (
                                <tr key={record.id} className="hover:bg-stone-50">
                                    <td className="px-4 py-3 text-stone-700">
                                        {new Date(record.date).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td className="px-4 py-3 text-stone-700">{record.losses}</td>
                                    <td className="px-4 py-3 text-stone-700">{record.eggs.toLocaleString('fr-FR')}</td>
                                    <td className="px-4 py-3 text-stone-700">
                                        <div>{record.feed_consumed ? `${record.feed_consumed} kg` : '—'}</div>
                                        {record.feed_type_name && <div className="text-xs text-stone-500">{record.feed_type_name}</div>}
                                        {record.avg_feed_per_bird && (
                                            <div className="text-xs mt-1 text-stone-500" title={`Moyenne par poule (Norme: ${record.theoretical_norm?.feed}g)`}>
                                                Moy: <span className={record.avg_feed_per_bird < (record.theoretical_norm?.feed || 0) * 0.9 ? 'text-red-500' : 'text-stone-700'}>{record.avg_feed_per_bird}g</span>/poule
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-stone-700">
                                        <div>{record.water_consumed ? `${record.water_consumed} L` : '—'}</div>
                                        {record.avg_water_per_bird && (
                                            <div className="text-xs mt-1 text-stone-500" title={`Moyenne par poule (Norme: ${record.theoretical_norm?.water}ml)`}>
                                                Moy: <span className={record.avg_water_per_bird < (record.theoretical_norm?.water || 0) * 0.9 ? 'text-red-500' : 'text-stone-700'}>{record.avg_water_per_bird}ml</span>/poule
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-stone-500 text-xs">
                                        {record.notes || '—'}
                                        {record.rejection_reason && (
                                            <div className="text-red-600 mt-1 font-medium">
                                                Motif : {record.rejection_reason}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${rsm.classes}`}>
                                            {rsm.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {record.status === 'pending' && (
                                            <RecordApprovalButtons
                                                record={record}
                                                rejectingId={rejectingId}
                                                rejectionReason={rejectionReason}
                                                onApprove={() => handleApprove(record.id)}
                                                onRejectStart={() => setRejectingId(record.id)}
                                                onRejectCancel={() => {
                                                    setRejectingId(null);
                                                    setRejectionReason('');
                                                }}
                                                onRejectSubmit={() => handleReject(record.id)}
                                                onReasonChange={setRejectionReason}
                                            />
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
                <div className="border-t border-stone-100 px-5 py-4 flex items-center justify-between text-sm text-stone-500 bg-white rounded-b-lg">
                    <span>Page {pagination.current_page} sur {pagination.last_page} — {pagination.total} résultats</span>
                    <div className="flex gap-1">
                        <button
                            disabled={pagination.current_page === 1}
                            onClick={() => goToPage(pagination.current_page - 1)}
                            className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            disabled={pagination.current_page === pagination.last_page}
                            onClick={() => goToPage(pagination.current_page + 1)}
                            className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <StatCard label="Total pertes" value={stats.totalLosses} />
                <StatCard label="Moy. œufs/jour" value={stats.avgEggs.toLocaleString('fr-FR')} />
                <StatCard label="Saisies approuvées" value={stats.count} />
            </div>

            {/* Modal de création */}
            {showDailyForm && flock && (
                <Modal title={`Nouveau suivi — ${flock.name}`} onClose={() => setShowDailyForm(false)}>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800">
                        Les données seront appliquées uniquement après validation du responsable.
                    </div>
                    <form onSubmit={handleDailySubmit} className="space-y-4">
                        <Field label="Date">
                            <input
                                type="date"
                                value={data.date}
                                onChange={e => setData({ ...data, date: e.target.value })}
                                required
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Pertes">
                            <input
                                type="number"
                                value={data.losses}
                                min="0"
                                onChange={e => setData({ ...data, losses: e.target.value })}
                                placeholder="0"
                                required
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Œufs collectés">
                            <input
                                type="number"
                                value={data.eggs}
                                min="0"
                                onChange={e => setData({ ...data, eggs: e.target.value })}
                                placeholder="0"
                                required
                                className={inputClass}
                            />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Type d'aliment">
                                <select
                                    value={data.feed_type_id}
                                    onChange={e => setData({ ...data, feed_type_id: e.target.value })}
                                    className={inputClass}
                                >
                                    <option value="">Sélectionner</option>
                                    {recipes.map(recipe => (
                                        <option key={recipe.id} value={recipe.id}>
                                            {recipe.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Aliment distribué (kg)">
                                <input
                                    type="number"
                                    value={data.feed_consumed}
                                    min="0"
                                    step="0.01"
                                    onChange={e => setData({ ...data, feed_consumed: e.target.value })}
                                    placeholder="Ex: 50.5"
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                        <Field label="Eau consommée (Litres)">
                            <input
                                type="number"
                                value={data.water_consumed}
                                min="0"
                                step="0.1"
                                onChange={e => setData({ ...data, water_consumed: e.target.value })}
                                placeholder="Ex: 100"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Notes (optionnel)">
                            <textarea
                                value={data.notes}
                                rows={2}
                                onChange={e => setData({ ...data, notes: e.target.value })}
                                placeholder="Observations..."
                                className={`${inputClass} resize-none`}
                            />
                        </Field>
                        <ModalFooter
                            onCancel={() => setShowDailyForm(false)}
                            submitLabel="Soumettre"
                            submitClass="bg-amber-500 hover:bg-amber-600 text-white"
                        />
                    </form>
                </Modal>
            )}
        </div>
    );
}
// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const inputClass =
    'w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white';

function Modal({
    title,
    onClose,
    children,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100">
                    <h2 className="text-base font-semibold text-stone-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
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

function StatCard({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
            <div className="text-xs text-stone-500 mb-1">{label}</div>
            <div className="text-xl font-semibold text-stone-900">{value}</div>
        </div>
    );
}

function ModalFooter({
    onCancel,
    submitLabel,
    submitClass,
}: {
    onCancel: () => void;
    submitLabel: string;
    submitClass: string;
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

interface RecordApprovalButtonsProps {
    record: DailyRecord;
    rejectingId: number | null;
    rejectionReason: string;
    approvingIdLoading?: number | null;
    rejectingIdLoading?: number | null;
    onApprove: () => void;
    onRejectStart: () => void;
    onRejectCancel: () => void;
    onRejectSubmit: () => void;
    onReasonChange: (reason: string) => void;
}

function RecordApprovalButtons({
    record,
    rejectingId,
    rejectionReason,
    approvingIdLoading,
    rejectingIdLoading,
    onApprove,
    onRejectStart,
    onRejectCancel,
    onRejectSubmit,
    onReasonChange,
}: RecordApprovalButtonsProps) {
    const isRejecting = rejectingId === record.id;
    const isApprovingLoading = approvingIdLoading === record.id;
    const isRejectingLoading = rejectingIdLoading === record.id;

    if (isRejecting) {
        return (
            <div className="flex items-center gap-1">
                <input
                    type="text"
                    value={rejectionReason}
                    onChange={e => onReasonChange(e.target.value)}
                    placeholder="Motif..."
                    className="border border-stone-200 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
                <button
                    onClick={onRejectSubmit}
                    disabled={!rejectionReason.trim() || isRejectingLoading}
                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isRejectingLoading ? (
                        <svg className="w-3 h-3 animate-spin text-white" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                    ) : 'OK'}
                </button>
                <button
                    onClick={onRejectCancel}
                    className="text-stone-400 hover:text-stone-600"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1">
            {record.can_approve && (
                <button
                    onClick={onApprove}
                    title="Approuver"
                    disabled={isApprovingLoading}
                    className={`p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors ${isApprovingLoading ? 'opacity-60 cursor-wait' : ''}`}
                >
                    {isApprovingLoading ? (
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                    ) : (
                        <CheckCircle className="w-4 h-4" />
                    )}
                </button>
            )}
            {record.can_reject && (
                <button
                    onClick={onRejectStart}
                    title="Rejeter"
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                    <XCircle className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}