import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Save, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { t } from '@/lib/i18n';
import {accountingRulesUpdate, accountingRulesStore, accountingRulesIndex} from '@/routes';

export default function Form({ rule, accounts }: { rule: any, accounts: any[] }) {
    const isEdit = !!rule;

    const { data, setData, post, put, processing, errors } = useForm({
        name: rule?.name || '',
        event_type: rule?.event_type || '',
        description: rule?.description || '',
        is_active: rule ? rule.is_active : true,
        lines: rule?.lines || [
            { type: 'debit', account_resolution_type: 'fixed', account_id: '', dynamic_account_placeholder: '', amount_source: 'total', percentage: 100, description_template: '', analytical_target_source: '' },
            { type: 'credit', account_resolution_type: 'fixed', account_id: '', dynamic_account_placeholder: '', amount_source: 'total', percentage: 100, description_template: '', analytical_target_source: '' }
        ]
    });

    const addLine = (type: 'debit' | 'credit') => {
        setData('lines', [...data.lines, {
            type, account_resolution_type: 'fixed', account_id: '', dynamic_account_placeholder: '', amount_source: 'total', percentage: 100, description_template: '', analytical_target_source: ''
        }]);
    };

    const removeLine = (index: number) => {
        const newLines = [...data.lines];
        newLines.splice(index, 1);
        setData('lines', newLines);
    };

    const updateLine = (index: number, field: string, value: any) => {
        const newLines = [...data.lines];
        newLines[index][field] = value;
        setData('lines', newLines);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(accountingRulesUpdate.url(rule.id));
        } else {
            post(accountingRulesStore.url());
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: t('accounting_rules.title') || 'Règles Comptables', href: accountingRulesIndex.url() }, {
            title: isEdit ? (t('common.edit') || 'Modifier') : (t('common.create') || 'Créer'),
            href: ''
        }]}>
            <Head title={isEdit ? (t('common.edit') || 'Modifier la règle') : (t('common.create') || 'Nouvelle règle')} />
            <div className="max-w-7xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => router.get(accountingRulesIndex.url())}
                            className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-stone-600" />
                        </button>
                        <h1 className="text-xl font-semibold text-stone-900">{isEdit ? 'Modifier la règle' : 'Créer une règle comptable (SYSCOHADA)'}</h1>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Nom de la règle</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-lg border-stone-200 focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                    placeholder="Ex: Vente d'œufs"
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Événement déclencheur</label>
                                <select
                                    value={data.event_type}
                                    onChange={e => setData('event_type', e.target.value)}
                                    className="w-full rounded-lg border-stone-200 focus:border-indigo-500 focus:ring-indigo-500 font-mono text-sm"
                                    required
                                >
                                    <option value="">Sélectionner un événement</option>
                                    <option value="invoice_sale_approved">Facture Vente Approuvée (invoice_sale_approved)</option>
                                    <option value="invoice_purchase_approved">Facture Achat Approuvée (invoice_purchase_approved)</option>
                                    <option value="payment_received">Paiement Reçu (payment_received)</option>
                                    <option value="payment_sent">Paiement Envoyé (payment_sent)</option>
                                </select>
                                <InputError message={errors.event_type} className="mt-2" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="w-full rounded-lg border-stone-200 focus:border-indigo-500 focus:ring-indigo-500"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="mt-10 border-t border-stone-200 pt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-stone-800">Lignes d'Écritures (Débit / Crédit)</h2>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => addLine('debit')} className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Débit
                                    </button>
                                    <button type="button" onClick={() => addLine('credit')} className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded border border-amber-200 hover:bg-amber-100 flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Crédit
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {data.lines.map((line: any, index: number) => (
                                    <div key={index} className={`p-4 border rounded-lg flex items-start gap-4 ${line.type === 'debit' ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
                                        <div className={`mt-2 font-bold text-xs uppercase tracking-wider ${line.type === 'debit' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {line.type}
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {/* Type de compte */}
                                            <div>
                                                <label className="block text-xs font-medium text-stone-500 mb-1">Type de Compte</label>
                                                <select
                                                    value={line.account_resolution_type}
                                                    onChange={e => updateLine(index, 'account_resolution_type', e.target.value)}
                                                    className="w-full text-sm rounded border-stone-200 py-1.5"
                                                >
                                                    <option value="fixed">Plan Comptable (Fixe)</option>
                                                    <option value="dynamic">Dynamique (Placeholder)</option>
                                                </select>
                                            </div>

                                            {/* Sélection Compte */}
                                            {line.account_resolution_type === 'fixed' ? (
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-stone-500 mb-1">Compte SYSCOHADA</label>
                                                    <select
                                                        value={line.account_id || ''}
                                                        onChange={e => updateLine(index, 'account_id', e.target.value)}
                                                        className="w-full text-sm rounded border-stone-200 py-1.5"
                                                        required
                                                    >
                                                        <option value="">Sélectionner un compte...</option>
                                                        {accounts.map(acc => (
                                                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="md:col-span-2">
                                                    <label className="block text-xs font-medium text-stone-500 mb-1">Placeholder</label>
                                                    <select
                                                        value={line.dynamic_account_placeholder || ''}
                                                        onChange={e => updateLine(index, 'dynamic_account_placeholder', e.target.value)}
                                                        className="w-full text-sm rounded border-stone-200 py-1.5"
                                                        required
                                                    >
                                                        <option value="">Sélectionner un type dynamique...</option>
                                                        <option value="partner_account">Compte du Tiers (Client/Fournisseur)</option>
                                                        <option value="payment_method_account">Compte de Trésorerie (Méthode de paiement)</option>
                                                    </select>
                                                </div>
                                            )}

                                            {/* Montant / Pourcentage */}
                                            <div className="flex gap-2">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-stone-500 mb-1">Montant</label>
                                                    <select
                                                        value={line.amount_source}
                                                        onChange={e => updateLine(index, 'amount_source', e.target.value)}
                                                        className="w-full text-sm rounded border-stone-200 py-1.5"
                                                    >
                                                        <option value="total">Total (TTC)</option>
                                                        <option value="subtotal">Sous-total (HT)</option>
                                                        <option value="tax_amount">Montant TVA</option>
                                                        <option value="amount">Montant Payé</option>
                                                        <option value="purchase_cost">Coût d'achat</option>
                                                    </select>
                                                </div>
                                                <div className="w-16">
                                                    <label className="block text-xs font-medium text-stone-500 mb-1">%</label>
                                                    <input
                                                        type="number"
                                                        value={line.percentage}
                                                        onChange={e => updateLine(index, 'percentage', e.target.value)}
                                                        className="w-full text-sm rounded border-stone-200 py-1.5 px-2"
                                                        min="0" max="100" step="0.01"
                                                    />
                                                </div>
                                            </div>

                                            {/* Ligne 2 : Libellé et Analytique */}
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-stone-500 mb-1">Libellé de l'écriture (optionnel)</label>
                                                <input
                                                    type="text"
                                                    value={line.description_template || ''}
                                                    onChange={e => updateLine(index, 'description_template', e.target.value)}
                                                    placeholder="Ex: Vente facture {{number}}"
                                                    className="w-full text-sm rounded border-stone-200 py-1.5"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-medium text-stone-500 mb-1">Cible Analytique</label>
                                                <select
                                                    value={line.analytical_target_source || ''}
                                                    onChange={e => updateLine(index, 'analytical_target_source', e.target.value)}
                                                    className="w-full text-sm rounded border-stone-200 py-1.5"
                                                >
                                                    <option value="">Aucune</option>
                                                    <option value="flock">Lot de poules (Génération)</option>
                                                    <option value="building">Bâtiment</option>
                                                </select>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => removeLine(index)}
                                            className="mt-8 text-stone-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-stone-200">
                            <button
                                type="button"
                                onClick={() => router.get(accountingRulesIndex.url())}
                                className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 font-medium text-sm transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium text-sm transition-colors flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Enregistrer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}