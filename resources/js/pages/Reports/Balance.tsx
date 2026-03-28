import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { FileText, ChevronRight, ChevronDown, ArrowLeft, TrendingUp, TrendingDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';


// Adapt interfaces for incoming Laravel data
interface JournalEntry {
    id: string;
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
}

interface SubAccount {
    code: string;
    name: string;
    debit: number;
    credit: number;
    balance: number;
}

interface Account {
    code: string;
    name: string;
    debit: number;
    credit: number;
    balance: number;
    type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' | string;
    subAccounts?: SubAccount[];
    entries?: JournalEntry[];
}

interface PageProps {
    accounts: Account[];
    total_debit: number;
    total_credit: number;
    net_result: number;
    start_date: string;
    end_date: string;
}

export default function ReportsBalance({ accounts, total_debit, total_credit, net_result, start_date, end_date }: PageProps) {
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [expandedAccounts, setExpandedAccounts] = useState<string[]>([]);

    // In case no accounts are provided yet, show a fallback UI or use mock data internally
    const safeAccounts = accounts || [];

    const toggleExpand = (code: string) => {
        setExpandedAccounts(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(route('reports.balance'), {
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
        }, { preserveState: true });
    };

    // Vue normale : Balance générale
    if (!selectedAccount) {
        return (
            <AppLayout breadcrumbs={[{ title: 'Balance Générale', href: route('reports.balance') }]}>
                <Head title="Balance Générale" />
                <div className="space-y-6 p-8 min-h-screen bg-stone-50 font-sans">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-stone-900">Comptabilité générale</h2>
                            <p className="text-sm text-stone-500 mt-1">
                                Balance générale et grand livre
                            </p>
                        </div>

                        {/* Filters & Export */}
                        <div className="flex items-center gap-3">
                            <form onSubmit={handleFilter} className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg p-1 shadow-sm">
                                <input
                                    type="date"
                                    name="start_date"
                                    defaultValue={start_date}
                                    className="px-2 py-1 text-sm border-0 focus:ring-0 text-stone-600 bg-transparent"
                                />
                                <span className="text-stone-300">→</span>
                                <input
                                    type="date"
                                    name="end_date"
                                    defaultValue={end_date}
                                    className="px-2 py-1 text-sm border-0 focus:ring-0 text-stone-600 bg-transparent"
                                />
                                <button type="submit" className="px-3 py-1.5 bg-stone-100 text-stone-700 text-xs font-medium rounded hover:bg-stone-200 transition-colors">
                                    Filtrer
                                </button>
                            </form>
                            <Button
                                variant="outline"
                                onClick={() => window.open(route('reports.balance.pdf') + `?start_date=${start_date}&end_date=${end_date}`, '_blank')}
                                className="gap-2 bg-white border-stone-200 text-stone-700 hover:bg-stone-50 shadow-sm"
                            >
                                <Printer className="w-4 h-4" />
                                <span className="hidden sm:inline">PDF</span>
                            </Button>
                        </div>
                    </div>

                    {/* Synthèse */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">Total Débits</p>
                                    <p className="text-2xl font-bold text-red-600">{total_debit.toLocaleString('fr-FR')} FCFA</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 text-red-600">
                                    <TrendingDown className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">Total Crédits</p>
                                    <p className="text-2xl font-bold text-emerald-600">{total_credit.toLocaleString('fr-FR')} FCFA</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-sm p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-xs font-medium uppercase tracking-wide opacity-90 mb-1">Résultat Net</p>
                                    <p className="text-2xl font-bold">{net_result.toLocaleString('fr-FR')} FCFA</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20">
                                    <FileText className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Balance générale */}
                    <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-stone-100 bg-stone-50">
                            <h3 className="text-base font-semibold text-stone-900">Balance Générale - {start_date ? new Date(start_date).toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}) : 'Toute période'}</h3>
                            <p className="text-xs text-stone-500 mt-1">Cliquez sur un compte pour voir le détail des écritures</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                            Compte
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                            Débit
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                            Crédit
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                            Solde
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-stone-500 uppercase tracking-wide w-10">
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {safeAccounts.map(account => {
                                        const isExpanded = expandedAccounts.includes(account.code);
                                        return (
                                            <React.Fragment key={account.code}>
                                                {/* Compte principal */}
                                                <tr
                                                    className="hover:bg-stone-50 cursor-pointer transition-colors"
                                                    onClick={() => setSelectedAccount(account)}
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleExpand(account.code);
                                                                }}
                                                                className="p-1 hover:bg-stone-200 rounded transition-colors"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronDown className="w-4 h-4 text-stone-600" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4 text-stone-600" />
                                                                )}
                                                            </button>
                                                            <div>
                                                                <p className="font-semibold text-stone-900">{account.code} - {account.name}</p>
                                                                {account.subAccounts && account.subAccounts.length > 0 && (
                                                                    <p className="text-xs text-stone-500 mt-0.5">{account.subAccounts.length} sous-comptes</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-mono text-stone-900">
                                                        {account.debit > 0 ? account.debit.toLocaleString('fr-FR') : '-'}
                                                    </td>
                                                    <td className="px-4 py-4 text-right font-mono text-stone-900">
                                                        {account.credit > 0 ? account.credit.toLocaleString('fr-FR') : '-'}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <span className={`font-mono font-semibold ${account.balance > 0 ? 'text-emerald-600' : 'text-red-600'
                                                            }`}>
                                                            {Math.abs(account.balance).toLocaleString('fr-FR')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <ChevronRight className="w-4 h-4 text-stone-400 mx-auto" />
                                                    </td>
                                                </tr>

                                                {/* Sous-comptes */}
                                                {isExpanded && account.subAccounts?.map(subAccount => (
                                                    <tr key={subAccount.code} className="bg-stone-50/50 hover:bg-stone-100 transition-colors">
                                                        <td className="px-6 py-3 pl-16">
                                                            <p className="text-sm text-stone-700">{subAccount.code} - {subAccount.name}</p>
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-sm text-stone-700">
                                                            {subAccount.debit > 0 ? subAccount.debit.toLocaleString('fr-FR') : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-mono text-sm text-stone-700">
                                                            {subAccount.credit > 0 ? subAccount.credit.toLocaleString('fr-FR') : '-'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <span className={`font-mono text-sm ${subAccount.balance > 0 ? 'text-emerald-600' : 'text-red-600'
                                                                }`}>
                                                                {Math.abs(subAccount.balance).toLocaleString('fr-FR')}
                                                            </span>
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}

                                    {/* Total */}
                                    <tr className="bg-amber-50 border-t-2 border-amber-200 font-semibold">
                                        <td className="px-6 py-4 text-stone-900">TOTAUX</td>
                                        <td className="px-4 py-4 text-right font-mono text-red-700">
                                            {total_debit.toLocaleString('fr-FR')}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-emerald-700">
                                            {total_credit.toLocaleString('fr-FR')}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-amber-700">
                                            {Math.abs(net_result).toLocaleString('fr-FR')}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // Vue détaillée : Écritures d'un compte (Drill-down)
    return (
        <AppLayout breadcrumbs={[{ title: 'Balance Générale', href: route('reports.balance') }]}>
            <Head title={`Détail ${selectedAccount.code}`} />
            <div className="space-y-6 p-8 min-h-screen bg-stone-50 font-sans">
                {/* Header avec retour */}
                <div>
                    <button
                        type="button"
                        onClick={() => setSelectedAccount(null)}
                        className="flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900 mb-3 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour à la balance
                    </button>
                    <h2 className="text-2xl font-bold text-stone-900">
                        {selectedAccount.code} - {selectedAccount.name}
                    </h2>
                    <p className="text-sm text-stone-500 mt-1">
                        Détail des écritures comptables
                    </p>
                </div>

                {/* Synthèse du compte */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">Total Débits</p>
                        <p className="text-2xl font-bold text-red-600">{selectedAccount.debit.toLocaleString('fr-FR')} FCFA</p>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">Total Crédits</p>
                        <p className="text-2xl font-bold text-emerald-600">{selectedAccount.credit.toLocaleString('fr-FR')} FCFA</p>
                    </div>

                    <div className="bg-white border border-stone-200 rounded-xl shadow-sm p-5">
                        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 mb-1">Solde</p>
                        <p className={`text-2xl font-bold ${selectedAccount.balance > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {Math.abs(selectedAccount.balance).toLocaleString('fr-FR')} FCFA
                        </p>
                    </div>
                </div>

                {/* Écritures */}
                <div className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-100 bg-stone-50">
                        <h3 className="text-base font-semibold text-stone-900">Journal des écritures</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-stone-50 border-b border-stone-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                        Référence
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                        Description
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                        Débit
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-stone-500 uppercase tracking-wide">
                                        Crédit
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {selectedAccount.entries && selectedAccount.entries.length > 0 ? selectedAccount.entries.map(entry => (
                                    <tr key={entry.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-6 py-4 text-stone-900">
                                            {new Date(entry.date).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                {entry.reference}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-stone-700">
                                            {entry.description}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-red-600">
                                            {entry.debit > 0 ? entry.debit.toLocaleString('fr-FR') : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-emerald-600">
                                            {entry.credit > 0 ? entry.credit.toLocaleString('fr-FR') : '-'}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-stone-400">Aucune écriture trouvée</td>
                                    </tr>
                                )}

                                {/* Total */}
                                <tr className="bg-stone-50 border-t-2 border-stone-200 font-semibold">
                                    <td colSpan={3} className="px-6 py-4 text-stone-900">TOTAL</td>
                                    <td className="px-4 py-4 text-right font-mono text-red-700">
                                        {selectedAccount.debit.toLocaleString('fr-FR')}
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono text-emerald-700">
                                        {selectedAccount.credit.toLocaleString('fr-FR')}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
