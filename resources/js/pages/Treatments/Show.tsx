import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { treatmentsIndex } from '@/routes';
import { formatCurrency } from '@/lib/utils';

interface Props {
    treatment: {
        id: number;
        flock_name: string;
        treatment_date: string;
        veterinarian: string | null;
        treatment_type: string | null;
        description: string | null;
        cost: number | null;
        invoice_reference: string | null;
        status: string;
        created_by: string;
        created_at: string;
        approved_by: string | null;
        approved_at: string | null;
        rejection_reason: string | null;
    };
}

export default function Show({ treatment }: Props) {
    return (
        <AppLayout>
            <Head title={`Traitement du ${new Date(treatment.treatment_date).toLocaleDateString('fr-FR')}`} />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-xl font-semibold text-stone-900">Détail du traitement</h1>
                        <button
                            onClick={() => router.get(treatmentsIndex.url())}
                            className="text-stone-400 hover:text-stone-600"
                        >
                            Retour
                        </button>
                    </div>

                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-stone-500">Lot</dt>
                            <dd className="font-medium text-stone-900">{treatment.flock_name}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Date</dt>
                            <dd>{new Date(treatment.treatment_date).toLocaleDateString('fr-FR')}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Type</dt>
                            <dd>{treatment.treatment_type || '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Vétérinaire</dt>
                            <dd>{treatment.veterinarian || '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Coût</dt>
                            <dd>{treatment.cost ? formatCurrency(treatment.cost) : '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Réf. facture</dt>
                            <dd>{treatment.invoice_reference || '-'}</dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-stone-500">Description</dt>
                            <dd className="mt-1 whitespace-pre-line">{treatment.description || '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Statut</dt>
                            <dd>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    treatment.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                    treatment.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                    {treatment.status === 'approved' ? 'Approuvé' : treatment.status === 'rejected' ? 'Rejeté' : 'Brouillon'}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Créé par</dt>
                            <dd>{treatment.created_by} le {treatment.created_at}</dd>
                        </div>
                        {treatment.approved_by && (
                            <>
                                <div>
                                    <dt className="text-stone-500">Approuvé par</dt>
                                    <dd>{treatment.approved_by}</dd>
                                </div>
                                <div>
                                    <dt className="text-stone-500">Date approbation</dt>
                                    <dd>{treatment.approved_at}</dd>
                                </div>
                            </>
                        )}
                        {treatment.rejection_reason && (
                            <div className="col-span-2">
                                <dt className="text-stone-500">Motif de rejet</dt>
                                <dd className="text-red-600">{treatment.rejection_reason}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}