import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { journalVouchersIndex } from '@/routes';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/i18n';

export default function JournalVoucherShow({ voucher }: VoucherShowPageProps) {
    const totalDebit = voucher.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = voucher.entries.reduce((sum, e) => sum + e.credit, 0);

    return (
        <AppLayout breadcrumbs={[
            { title: 'Pièces comptables', href: journalVouchersIndex.url() },
            { title: voucher.voucher_number, href: '#' },
        ]}>
            <Head title={`Pièce ${voucher.voucher_number}`} />
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-xl font-semibold text-stone-900">Pièce n° {voucher.voucher_number}</h1>
                            <p className="text-stone-500 text-sm mt-1">Date : {new Date(voucher.date).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <button
                            onClick={() => router.get(journalVouchersIndex.url())}
                            className="text-stone-400 hover:text-stone-600"
                        >
                            Retour
                        </button>
                    </div>

                    <div className="mb-6 p-4 bg-stone-50 rounded-lg">
                        <p className="text-sm text-stone-700">
                            <span className="font-medium">Description :</span> {voucher.description || 'Aucune description'}
                        </p>
                        <p className="text-xs text-stone-500 mt-2">
                            Source : {voucher.source_type} #{voucher.source_id} — Créé par {voucher.created_by} le {voucher.created_at}
                        </p>
                    </div>

                    <h2 className="text-base font-medium text-stone-800 mb-3">Lignes d'écriture</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border border-stone-200">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-stone-600">Compte</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-stone-600">Libellé</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-stone-600">Débit</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-stone-600">Crédit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {voucher.entries.map((line, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-2 font-mono">{line.account_code} - {line.account_name}</td>
                                        <td className="px-4 py-2 text-stone-600">{line.description || '-'}</td>
                                        <td className="px-4 py-2 text-right text-emerald-600">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                                        <td className="px-4 py-2 text-right text-amber-600">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-stone-50 font-medium">
                                <tr>
                                    <td colSpan={2} className="px-4 py-2 text-right">Totaux :</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(totalDebit)}</td>
                                    <td className="px-4 py-2 text-right">{formatCurrency(totalCredit)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}