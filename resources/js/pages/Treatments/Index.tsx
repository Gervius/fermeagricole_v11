// resources/js/Pages/Treatments/Index.tsx (version avec modal d'approbation)
import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Plus, Calendar as CalendarIcon, Droplet, Syringe, Shield,
    AlertCircle, ChevronLeft, ChevronRight, Info, DollarSign,
    X, CheckCircle, XCircle
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { treatmentsCreate, treatmentsShow, treatmentsApprove, treatmentsReject } from '@/routes';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isPast, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';

// Types (identique)
type TreatmentStatus = 'draft' | 'approved' | 'rejected';

interface Treatment {
    id: number;
    flock_name: string;
    treatment_date: string;
    treatment_type: string | null;
    veterinarian: string | null;
    description: string | null;
    cost: number | null;
    invoice_reference: string | null;
    status: TreatmentStatus;
    created_by: string;
    created_at: string;
    approved_by: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    can_approve: boolean;
    can_reject: boolean;
    // autres champs...
}

interface UpcomingTreatment {
    id: number;
    flock_name: string;
    treatment_date: string;
    treatment_type: string | null;
    days_left: number;
}

interface Stats {
    total_cost: number;
    average_cost_per_bird: number;
    active_birds: number;
}

interface Props {
    treatments: {
        data: Treatment[];
        current_page: number;
        last_page: number;
        total: number;
    };
    flocks: { id: number; name: string }[];
    filters: { flock_id?: string; status?: string };
    stats: Stats;
    upcoming_treatments: UpcomingTreatment[];
    flash?: { success?: string; error?: string };
}

// Mapping des icônes par type de traitement
const TYPE_ICON_MAP: Record<string, React.ReactNode> = {
    water: <Droplet className="w-4 h-4" />,
    injection: <Syringe className="w-4 h-4" />,
    prevention: <Shield className="w-4 h-4" />,
    default: <Syringe className="w-4 h-4" />,
};

const TYPE_COLOR_MAP: Record<string, string> = {
    water: 'bg-blue-100 text-blue-700 border-blue-200',
    injection: 'bg-amber-100 text-amber-700 border-amber-200',
    prevention: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STATUS_META: Record<TreatmentStatus, { label: string; classes: string }> = {
    draft:    { label: 'Brouillon',   classes: 'bg-slate-100 text-slate-600 border border-slate-200' },
    approved: { label: 'Approuvé',    classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    rejected: { label: 'Rejeté',      classes: 'bg-red-100 text-red-600 border border-red-200' },
};

export default function TreatmentsIndex({ treatments, flocks, filters, stats, upcoming_treatments, flash }: Props) {
    const { addToast } = useToasts();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Notifications flash
    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    // Créer un dictionnaire des traitements par date
    const treatmentsByDate = useMemo(() => {
        const map = new Map<string, Treatment[]>();
        treatments.data.forEach(t => {
            const dateKey = t.treatment_date;
            if (!map.has(dateKey)) map.set(dateKey, []);
            map.get(dateKey)!.push(t);
        });
        return map;
    }, [treatments.data]);

    // Générer les jours du mois
    const monthDays = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    // Navigation mois
    const prevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const nextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

    const getIcon = (type: string | null) => TYPE_ICON_MAP[type || 'default'] || TYPE_ICON_MAP.default;
    const getTypeColor = (type: string | null) => TYPE_COLOR_MAP[type || ''] || 'bg-stone-100 text-stone-600 border-stone-200';

    // Handlers d'approbation/rejet
    const handleApprove = () => {
        if (!selectedTreatment) return;
        setActionLoading(true);
        router.post(treatmentsApprove.url(selectedTreatment.id), {}, {
            onSuccess: () => {
                setShowDetailModal(false);
                setSelectedTreatment(null);
                addToast({ message: 'Traitement approuvé', type: 'success' });
                // Recharger les données du calendrier
                router.reload({ only: ['treatments', 'upcoming_treatments', 'stats'] });
            },
            onError: (err: any) => {
                addToast({ message: err.message || "Erreur lors de l'approbation", type: 'error' });
            },
            onFinish: () => setActionLoading(false),
        });
    };

    const handleReject = () => {
        if (!selectedTreatment || !rejectionReason.trim()) return;
        setActionLoading(true);
        router.post(treatmentsReject.url(selectedTreatment.id), { reason: rejectionReason }, {
            onSuccess: () => {
                setShowDetailModal(false);
                setSelectedTreatment(null);
                setRejectionReason('');
                addToast({ message: 'Traitement rejeté', type: 'success' });
                router.reload({ only: ['treatments', 'upcoming_treatments', 'stats'] });
            },
            onError: (err: any) => {
                addToast({ message: err.message || "Erreur lors du rejet", type: 'error' });
            },
            onFinish: () => setActionLoading(false),
        });
    };

    const openDetailModal = (treatment: Treatment) => {
        setSelectedTreatment(treatment);
        setRejectionReason('');
        setShowDetailModal(true);
    };

    return (
        <AppLayout>
            <Head title="Traitements vétérinaires" />
            <div className="min-h-screen bg-stone-50 font-sans">

                {/* En-tête identique */}
                <div className="bg-white border-b border-stone-200 px-8 py-6">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                                Traitements vétérinaires
                            </h1>
                            <p className="text-stone-500 text-sm mt-0.5">
                                {treatments.total} traitement{treatments.total !== 1 ? 's' : ''} enregistrés
                            </p>
                        </div>
                        <button
                            onClick={() => router.get(treatmentsCreate.url())}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nouveau traitement
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

                    {/* KPI (inchangé) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500 font-medium">Coût total des traitements</p>
                                    <p className="text-2xl font-bold text-stone-900">
                                        {formatCurrency(stats.total_cost)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                    <Info className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500 font-medium">Coût moyen par poule</p>
                                    <p className="text-2xl font-bold text-stone-900">
                                        {formatCurrency(stats.average_cost_per_bird)}
                                    </p>
                                    <p className="text-xs text-stone-400">{stats.active_birds} poules actives</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prochaines interventions (alertes) - inchangé */}
                    {upcoming_treatments.length > 0 && (
                        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                Prochaines interventions
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {upcoming_treatments.map(t => {
                                    const daysLeft = t.days_left;
                                    const isCritical = daysLeft <= 2;
                                    const isUrgent = daysLeft <= 5 && daysLeft > 2;
                                    return (
                                        <div
                                            key={t.id}
                                            onClick={() => {
                                                // On pourrait ouvrir le détail, mais pour l'instant on laisse juste l'affichage
                                                // Optionnel: router.get(treatmentsShow.url(t.id))
                                            }}
                                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:shadow-md transition ${
                                                isCritical ? 'bg-red-50 border-red-200' :
                                                isUrgent ? 'bg-amber-50 border-amber-200' :
                                                'bg-stone-50 border-stone-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-1.5 rounded-full ${
                                                    isCritical ? 'bg-red-100 text-red-600' :
                                                    isUrgent ? 'bg-amber-100 text-amber-600' :
                                                    'bg-stone-100 text-stone-600'
                                                }`}>
                                                    {getIcon(t.treatment_type)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-stone-900">{t.flock_name}</p>
                                                    <p className="text-xs text-stone-500">
                                                        {format(parseISO(t.treatment_date), 'dd MMM', { locale: fr })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-sm font-bold ${
                                                    isCritical ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-stone-600'
                                                }`}>
                                                    {daysLeft === 0 ? 'Aujourd\'hui' : `J-${daysLeft}`}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Calendrier mensuel */}
                    <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-stone-900">
                                Calendrier de prophylaxie
                            </h2>
                            <div className="flex items-center gap-2">
                                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-stone-100">
                                    <ChevronLeft className="w-4 h-4 text-stone-600" />
                                </button>
                                <span className="text-sm font-medium text-stone-700">
                                    {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                                </span>
                                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-stone-100">
                                    <ChevronRight className="w-4 h-4 text-stone-600" />
                                </button>
                            </div>
                        </div>

                        {/* Jours de la semaine */}
                        <div className="grid grid-cols-7 gap-px bg-stone-200">
                            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                                <div key={day} className="bg-stone-50 px-3 py-2 text-center text-xs font-semibold text-stone-600">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Grille des jours */}
                        <div className="grid grid-cols-7 gap-px bg-stone-200">
                            {monthDays.map(day => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const dayTreatments = treatmentsByDate.get(dateKey) || [];
                                const isTodayDay = isToday(day);
                                const isPastDay = isPast(day) && !isTodayDay;
                                const isCurrentMonth = isSameMonth(day, currentMonth);

                                return (
                                    <div
                                        key={dateKey}
                                        className={`bg-white min-h-[100px] p-2 ${!isCurrentMonth ? 'opacity-40' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`text-xs font-medium ${
                                                isTodayDay ? 'text-amber-600 font-bold' : 'text-stone-500'
                                            }`}>
                                                {format(day, 'd')}
                                            </span>
                                            {dayTreatments.length > 0 && (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                                    {dayTreatments.length}
                                                </span>
                                            )}
                                        </div>

                                        {/* Liste des traitements du jour */}
                                        <div className="mt-1 space-y-1">
                                            {dayTreatments.map(t => {
                                                const isPastTreatment = isPastDay || (isPast(parseISO(t.treatment_date)) && !isTodayDay);
                                                return (
                                                    <div
                                                        key={t.id}
                                                        onClick={() => openDetailModal(t)}
                                                        className={`flex items-center gap-1 p-1 rounded text-xs cursor-pointer transition-all ${
                                                            isTodayDay ? 'animate-pulse bg-blue-50 border border-blue-300' : ''
                                                        } ${
                                                            isPastTreatment ? 'opacity-50 grayscale' : 'hover:bg-stone-50'
                                                        }`}
                                                    >
                                                        <span className={`p-0.5 rounded ${getTypeColor(t.treatment_type)}`}>
                                                            {getIcon(t.treatment_type)}
                                                        </span>
                                                        <span className="truncate text-stone-700">{t.flock_name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Lien vers la vue liste (optionnel) */}
                    <div className="text-right">
                        <button
                            onClick={() => router.get('/treatments?view=list')}
                            className="text-sm text-amber-600 hover:text-amber-700"
                        >
                            Voir en liste classique →
                        </button>
                    </div>
                </div>

                {/* Modal de détail et d'approbation */}
                {showDetailModal && selectedTreatment && (
                    <TreatmentDetailModal
                        treatment={selectedTreatment}
                        rejectionReason={rejectionReason}
                        setRejectionReason={setRejectionReason}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onClose={() => setShowDetailModal(false)}
                        actionLoading={actionLoading}
                    />
                )}
            </div>
        </AppLayout>
    );
}

// Composant Modal de détail
function TreatmentDetailModal({ treatment, rejectionReason, setRejectionReason, onApprove, onReject, onClose, actionLoading }: any) {
    const statusMeta = STATUS_META[treatment.status];
    const canApprove = treatment.can_approve;
    const canReject = treatment.can_reject;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-7 py-5 border-b border-stone-100">
                    <h2 className="text-base font-semibold text-stone-900">Détail du traitement</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-7 py-6 space-y-4">
                    {/* Informations */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <InfoRow label="Lot" value={treatment.flock_name} />
                        <InfoRow label="Date" value={format(parseISO(treatment.treatment_date), 'dd/MM/yyyy')} />
                        <InfoRow label="Type" value={treatment.treatment_type || '-'} />
                        <InfoRow label="Vétérinaire" value={treatment.veterinarian || '-'} />
                        <InfoRow label="Coût" value={treatment.cost ? formatCurrency(treatment.cost) : '-'} />
                        <InfoRow label="Statut">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusMeta.classes}`}>
                                {statusMeta.label}
                            </span>
                        </InfoRow>
                    </div>
                    {treatment.description && (
                        <div className="text-sm">
                            <span className="text-stone-500 font-medium">Description :</span>
                            <p className="mt-1 text-stone-700 whitespace-pre-wrap">{treatment.description}</p>
                        </div>
                    )}
                    {treatment.rejection_reason && (
                        <div className="text-sm">
                            <span className="text-stone-500 font-medium">Motif de rejet :</span>
                            <p className="mt-1 text-red-600">{treatment.rejection_reason}</p>
                        </div>
                    )}

                    {/* Actions d'approbation/rejet */}
                    {(canApprove || canReject) && treatment.status === 'draft' && (
                        <div className="border-t border-stone-100 pt-4 space-y-4">
                            {canReject && (
                                <div>
                                    <label className="block text-xs font-medium text-stone-600 mb-1.5">
                                        Motif de rejet <span className="text-stone-400">(obligatoire si rejeté)</span>
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        rows={2}
                                        placeholder="Expliquez la raison du rejet..."
                                        className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                                    />
                                </div>
                            )}
                            <div className="flex gap-3">
                                {canReject && (
                                    <button
                                        onClick={onReject}
                                        disabled={!rejectionReason.trim() || actionLoading}
                                        className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg disabled:opacity-40 flex items-center justify-center gap-1.5"
                                    >
                                        {actionLoading ? '...' : <><XCircle className="w-4 h-4" /> Rejeter</>}
                                    </button>
                                )}
                                {canApprove && (
                                    <button
                                        onClick={onApprove}
                                        disabled={actionLoading}
                                        className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg flex items-center justify-center gap-1.5"
                                    >
                                        {actionLoading ? '...' : <><CheckCircle className="w-4 h-4" /> Approuver</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value, children }: any) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="text-stone-500 min-w-[80px] text-xs font-medium">{label} :</span>
            <span className="text-stone-900 font-medium text-sm">{children || value}</span>
        </div>
    );
}