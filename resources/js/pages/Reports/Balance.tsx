import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { reportsBalance } from '@/routes';
import { FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';


interface BalanceLine {
    code: string;
    name: string;
    debit: number;
    credit: number;
    balance: number;
}

interface BalanceReport {
    accounts: BalanceLine[];
    total_debit: number;
    total_credit: number;
}

interface BalancePageProps {
    accounts: any[];
    totalDebit: number;
    totalCredit: number;
    filters: { start_date?: string; end_date?: string };
}

export default function BalanceReport({ accounts, totalDebit, totalCredit, filters }: BalancePageProps) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    const applyFilters = () => {
        router.get(reportsBalance.url(), {
            start_date: startDate || undefined,
            end_date: endDate || undefined,
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setStartDate('');
        setEndDate('');
        router.get(reportsBalance.url(), {}, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Balance générale', href: reportsBalance.url() }]}>
            <Head title="Balance générale" />
            <div className="max-w-6xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-semibold text-stone-900">Balance générale</h1>
                        <a
                            href="/reports/balance/pdf"
                            target="_blank"
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <FileText className="w-4 h-4" />
                            Télécharger PDF
                        </a>
                    </div>

                    {/* Filtres */}
                    <div className="flex flex-wrap gap-3 items-end mb-6">
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
                                Générer
                            </button>
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 border border-stone-200 text-stone-600 text-sm rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    </div>

                    {/* Tableau de balance */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-stone-600">Compte</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-stone-600">Intitulé</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-stone-600">Débit</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-stone-600">Crédit</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-stone-600">Solde</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {accounts?.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-stone-50">
                                        <td className="px-4 py-2 font-mono">{line.code}</td>
                                        <td className="px-4 py-2">{line.name}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(line?.debit || 0)}</td>
                                        <td className="px-4 py-2 text-right">{formatCurrency(line?.credit || 0)}</td>
                                        <td className={`px-4 py-2 text-right font-medium ${line.balance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {line.solde_debiteur ? formatCurrency(line.solde_debiteur) + ' (D)' : ''}
                                            {line.solde_crediteur ? formatCurrency(line.solde_crediteur) + ' (C)' : ''}
                                            {(!line.solde_debiteur && !line.solde_crediteur) ? formatCurrency(0) : ''}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-stone-50 font-medium">
                                <tr>
                                    <td colSpan={2} className="px-4 py-2 text-right">Totaux :</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(totalDebit || 0)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(totalCredit || 0)}</td>
                                    <td className="px-4 py-2 text-right">—</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {accounts?.length === 0 && (
                        <p className="text-center text-stone-400 py-8">Aucune écriture pour la période sélectionnée.</p>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}