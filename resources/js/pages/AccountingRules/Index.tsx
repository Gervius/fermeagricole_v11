import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { t } from '@/lib/i18n';
import { accountingRulesEdit, accountingRulesDestroy, accountingRulesIndex, accountingRulesCreate  } from '@/routes';

export default function Index({ rules }: { rules: any[] }) {
    const deleteRule = (id: number) => {
        if (confirm('Voulez-vous vraiment supprimer cette règle comptable ?')) {
            router.delete(accountingRulesDestroy.url({ id }));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('accounting_rules.title') || 'Règles Comptables', href: accountingRulesIndex.url() }]}>
            <Head title={t('accounting_rules.title') || 'Règles Comptables'} />
            <div className="max-w-7xl mx-auto py-8 px-4">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-stone-900">{t('accounting_rules.title') || 'Règles Comptables'}</h1>
                        <p className="text-sm text-stone-500">Moteur de génération automatique des écritures comptables (SYSCOHADA)</p>
                    </div>
                    <Link
                        href={accountingRulesCreate.url()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t('accounting_rules.create') || 'Nouvelle Règle'}
                    </Link>
                </div>

                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium">
                            <tr>
                                <th className="px-6 py-3">Nom</th>
                                <th className="px-6 py-3">Événement déclencheur</th>
                                <th className="px-6 py-3">Statut</th>
                                <th className="px-6 py-3 text-right">Lignes (Débit/Crédit)</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {rules.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-stone-400">
                                        Aucune règle configurée.
                                    </td>
                                </tr>
                            ) : rules.map(rule => (
                                <tr key={rule.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-stone-900">{rule.name}</td>
                                    <td className="px-6 py-4 font-mono text-xs bg-stone-100 rounded inline-block mt-3 mb-3 ml-6">{rule.event_type}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${rule.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-800'}`}>
                                            {rule.is_active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-stone-600">
                                        {rule.lines.length} lignes
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={accountingRulesEdit.url({ id: rule.id })}
                                                className="p-1.5 text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => deleteRule(rule.id)}
                                                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}