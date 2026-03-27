import React, { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import { Eye, ChevronLeft, ChevronRight, Calendar, Download } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { journalVouchersIndex, journalVoucherShow } from '@/routes';


interface JournalEntryLine {
    id: number;
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
    description: string | null;
}
interface JournalVoucher {
    id: number;
    voucher_number: string;
    date: string;               // Y-m-d
    description: string | null;
    source_type: string;        // ex: App\Models\EggSale
    source_id: number;
    created_by: string;
    created_at: string;          // d/m/Y H:i
    entries: JournalEntryLine[]; // chargé seulement dans show
    entries_count?: number;      // pour l'index
}

interface PaginatedVouchers {
    data: JournalVoucher[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: any[];
}

interface VouchersPageProps {
    vouchers: PaginatedVouchers;
    filters: { start_date?: string; end_date?: string };
    flash?: { success?: string; error?: string };
}

interface VoucherShowPageProps {
    voucher: JournalVoucher & { entries: JournalEntryLine[] };
}


export default function JournalVouchersIndex({ vouchers, filters, flash }: VouchersPageProps) {
    const { addToast } = useToasts();
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const applyFilters = () => {
        router.get(journalVouchersIndex.url(), {
            start_date: startDate || undefined,
            end_date: endDate || undefined,
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        router.get(journalVouchersIndex.url(), {}, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Pièces comptables', href: journalVouchersIndex.url() }]}>
            <Head title="Pièces comptables" />
            <div className="min-h-screen bg-stone-50 font-sans">

                <div className="bg-white border-b border-stone-200 px-8 py-6">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                            Pièces comptables
                        </h1>
                        <p className="text-stone-500 text-sm mt-0.5">
                            {vouchers.total} pièce{vouchers.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
                    {/* Filtres par date */}
                    <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
                        <div className="min-w-[180px]">
                            <label className="block text-xs text-stone-500 mb-1.5 font-medium">Date début</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
                        </div>
                        <div className="min-w-[180px]">
                            <label className="block text-xs text-stone-500 mb-1.5 font-medium">Date fin</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            />
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

                    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-stone-100 bg-stone-50">
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">N° Pièce</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Date</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Description</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Source</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Nb lignes</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Créé par</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {vouchers.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-5 py-12 text-center text-stone-400 text-sm">
                                                Aucune pièce trouvée.
                                            </td>
                                        </tr>
                                    ) : (
                                        vouchers?.data?.map(v => (
                                            <tr key={v.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-5 py-4 font-mono text-stone-900">{v.voucher_number}</td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className="flex items-center gap-1.5 text-stone-600">
                                                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                                        {new Date(v.date).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-stone-600 max-w-xs truncate">{v.description || '-'}</td>
                                                <td className="px-5 py-4 text-stone-600 text-xs">
                                                    {v.source_type.split('\\').pop()} #{v.source_id}
                                                </td>
                                                <td className="px-5 py-4 text-stone-600 text-center">{v.entries_count}</td>
                                                <td className="px-5 py-4 text-stone-600">{v.created_by}</td>
                                                <td className="px-5 py-4">
                                                    <button
                                                        onClick={() => router.get(journalVoucherShow.url(v.id))}
                                                        className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        title="Voir"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {vouchers.last_page > 1 && (
                            <div className="border-t border-stone-100 px-5 py-4 flex items-center justify-between text-sm text-stone-500">
                                <span>Page {vouchers.current_page} sur {vouchers.last_page} — {vouchers.total} résultats</span>
                                <div className="flex gap-1">
                                    <button
                                        disabled={vouchers.current_page === 1}
                                        onClick={() => router.get(journalVouchersIndex.url(), { ...filters, page: vouchers.current_page - 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={vouchers.current_page === vouchers.last_page}
                                        onClick={() => router.get(journalVouchersIndex.url(), { ...filters, page: vouchers.current_page + 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}