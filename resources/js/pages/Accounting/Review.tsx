import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { FileEdit, CheckCircle, Save, XCircle, Plus, Trash2 } from 'lucide-react';
import { accountingReview, journalVouchersPost, journalVouchersUpdate } from '@/routes';

interface Account {
    id: number;
    code: string;
    name: string;
}

interface JournalEntry {
    id?: number;
    account_id: number;
    debit: number;
    credit: number;
    description: string;
    account?: Account;
}

interface JournalVoucher {
    id: number;
    voucher_number: string | null;
    status: 'draft' | 'posted';
    date: string;
    description: string;
    entries: JournalEntry[];
    creator?: { name: string };
    created_at: string;
}

interface Props {
    draftVouchers: {
        data: JournalVoucher[];
        current_page: number;
        last_page: number;
    };
    accounts: Account[];
    flash?: { success?: string; error?: string; message?: string };
}

export default function Review({ draftVouchers, accounts, flash }: Props) {
    const { addToast } = useToasts();
    const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null);

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error || flash?.message) addToast({ message: (flash.error || flash.message) as string, type: 'error' });
    }, [flash]);

    return (
        <AppLayout breadcrumbs={[{ title: 'Révision Comptable', href: '/accounting/review' }]}>
            <Head title="Révision Comptable" />

            <div className="min-h-screen bg-stone-50 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
                            <FileEdit className="w-6 h-6 text-indigo-600" />
                            Écritures en attente de validation
                        </h1>
                        <p className="mt-1 text-sm text-stone-500">
                            Vérifiez, modifiez les ventilations, et validez les écritures brouillons pour les poster dans le Grand Livre.
                        </p>
                    </div>

                    {draftVouchers.data.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-12 text-center">
                            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-stone-900">Tout est à jour !</h3>
                            <p className="text-stone-500 mt-1">Il n'y a aucune écriture comptable en attente de révision.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {draftVouchers.data.map(voucher => (
                                <VoucherCard
                                    key={voucher.id}
                                    voucher={voucher}
                                    accounts={accounts}
                                    isEditing={editingVoucherId === voucher.id}
                                    onEdit={() => setEditingVoucherId(voucher.id)}
                                    onCancel={() => setEditingVoucherId(null)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

function VoucherCard({ voucher, accounts, isEditing, onEdit, onCancel }: { voucher: JournalVoucher, accounts: Account[], isEditing: boolean, onEdit: () => void, onCancel: () => void }) {

    const { data, setData, put, processing, reset } = useForm({
        description: voucher.description,
        entries: voucher.entries.map(e => ({
            id: e.id,
            account_id: e.account_id,
            debit: parseFloat(e.debit.toString()),
            credit: parseFloat(e.credit.toString()),
            description: e.description
        }))
    });

    const [isPosting, setIsPosting] = useState(false);

    const totalDebit = data.entries.reduce((sum, e) => sum + Number(e.debit || 0), 0);
    const totalCredit = data.entries.reduce((sum, e) => sum + Number(e.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        put(journalVouchersUpdate.url(voucher.id), {
            onSuccess: () => onCancel(),
        });
    };

    const handlePost = () => {
        if (!confirm('Êtes-vous sûr de vouloir poster cette écriture définitivement ? Elle ne pourra plus être modifiée.')) return;
        setIsPosting(true);
        router.post(journalVouchersPost.url(voucher.id), {}, {
            onFinish: () => setIsPosting(false)
        });
    };

    const addEntry = () => {
        setData('entries', [...data.entries, { account_id: accounts[0]?.id || 0, debit: 0, credit: 0, description: data.description }]);
    };

    const removeEntry = (index: number) => {
        const newEntries = [...data.entries];
        newEntries.splice(index, 1);
        setData('entries', newEntries);
    };

    if (!isEditing) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded uppercase tracking-wider">
                                Brouillon
                            </span>
                            <span className="text-sm font-medium text-stone-500">Date: {new Date(voucher.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-stone-900">{voucher.description}</h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                        >
                            Modifier
                        </button>
                        <button
                            onClick={handlePost}
                            disabled={isPosting}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                            <CheckCircle className="w-4 h-4" /> Poster
                        </button>
                    </div>
                </div>
                <div className="px-6 py-4">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-stone-500 border-b border-stone-100">
                                <th className="pb-2 font-medium">Compte</th>
                                <th className="pb-2 font-medium">Libellé ligne</th>
                                <th className="pb-2 font-medium text-right">Débit</th>
                                <th className="pb-2 font-medium text-right">Crédit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {voucher.entries.map((entry, idx) => (
                                <tr key={entry.id || idx}>
                                    <td className="py-3 text-stone-900 font-medium">
                                        {entry.account?.code} - {entry.account?.name}
                                    </td>
                                    <td className="py-3 text-stone-600">{entry.description}</td>
                                    <td className="py-3 text-right font-medium text-stone-900">
                                        {Number(entry.debit) > 0 ? Number(entry.debit).toLocaleString('fr-FR') : '-'}
                                    </td>
                                    <td className="py-3 text-right font-medium text-stone-900">
                                        {Number(entry.credit) > 0 ? Number(entry.credit).toLocaleString('fr-FR') : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-stone-50 font-bold border-t border-stone-200">
                                <td colSpan={2} className="py-3 px-2 text-right">Total</td>
                                <td className="py-3 text-right text-indigo-700">{totalDebit.toLocaleString('fr-FR')}</td>
                                <td className="py-3 text-right text-indigo-700">{totalCredit.toLocaleString('fr-FR')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        );
    }

    // Vue Édition
    return (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-md border-2 border-indigo-200 overflow-hidden ring-4 ring-indigo-50">
            <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100">
                <div className="mb-4">
                    <label className="block text-xs font-medium text-stone-600 mb-1">Libellé de l'écriture</label>
                    <input
                        type="text"
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
            </div>

            <div className="px-6 py-4 overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-stone-500 border-b border-stone-200">
                            <th className="pb-2 font-medium w-1/3">Compte</th>
                            <th className="pb-2 font-medium w-1/3">Libellé</th>
                            <th className="pb-2 font-medium w-1/6 text-right">Débit</th>
                            <th className="pb-2 font-medium w-1/6 text-right">Crédit</th>
                            <th className="pb-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                        {data.entries.map((entry, idx) => (
                            <tr key={idx}>
                                <td className="py-2 pr-2">
                                    <select
                                        value={entry.account_id}
                                        onChange={e => {
                                            const newEntries = [...data.entries];
                                            newEntries[idx].account_id = parseInt(e.target.value);
                                            setData('entries', newEntries);
                                        }}
                                        className="w-full border-stone-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="py-2 px-2">
                                    <input
                                        type="text"
                                        value={entry.description}
                                        onChange={e => {
                                            const newEntries = [...data.entries];
                                            newEntries[idx].description = e.target.value;
                                            setData('entries', newEntries);
                                        }}
                                        className="w-full border-stone-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </td>
                                <td className="py-2 px-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={entry.debit}
                                        onChange={e => {
                                            const newEntries = [...data.entries];
                                            newEntries[idx].debit = parseFloat(e.target.value) || 0;
                                            if (newEntries[idx].debit > 0) newEntries[idx].credit = 0;
                                            setData('entries', newEntries);
                                        }}
                                        className="w-full text-right border-stone-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </td>
                                <td className="py-2 pl-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={entry.credit}
                                        onChange={e => {
                                            const newEntries = [...data.entries];
                                            newEntries[idx].credit = parseFloat(e.target.value) || 0;
                                            if (newEntries[idx].credit > 0) newEntries[idx].debit = 0;
                                            setData('entries', newEntries);
                                        }}
                                        className="w-full text-right border-stone-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </td>
                                <td className="py-2 text-right">
                                    <button
                                        type="button"
                                        onClick={() => removeEntry(idx)}
                                        className="text-stone-400 hover:text-red-500 transition-colors p-1"
                                        disabled={data.entries.length <= 2}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={5} className="py-3">
                                <button
                                    type="button"
                                    onClick={addEntry}
                                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" /> Ajouter une ligne
                                </button>
                            </td>
                        </tr>
                        <tr className="bg-stone-50 font-bold border-t border-stone-200">
                            <td colSpan={2} className="py-3 px-2 text-right">Total</td>
                            <td className={`py-3 text-right ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                                {totalDebit.toLocaleString('fr-FR')}
                            </td>
                            <td className={`py-3 pl-2 text-right ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>
                                {totalCredit.toLocaleString('fr-FR')}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
                {!isBalanced && (
                    <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-1 justify-end">
                        <XCircle className="w-4 h-4" /> L'écriture n'est pas équilibrée (Différence: {Math.abs(totalDebit - totalCredit).toLocaleString('fr-FR')})
                    </p>
                )}
            </div>

            <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => { reset(); onCancel(); }}
                    className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-md shadow-sm hover:bg-stone-50"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={processing || !isBalanced}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> Enregistrer les modifications
                </button>
            </div>
        </form>
    );
}