import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { stockMovementsIndex } from '@/routes';
import { formatCurrency } from '@/lib/utils';

interface Props {
    movement: {
        id: number;
        ingredient_name: string;
        type: string;
        quantity: number;
        unit_symbol: string;
        unit_price: number | null;
        reason: string | null;
        reference: string | null;
        status: string;
        created_by_name: string;
        created_at: string;
        approved_by_name: string | null;
        approved_at: string | null;
        rejection_reason: string | null;
    };
}

export default function Show({ movement }: Props) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Détail mouvement', href: '#' }]}>
            <Head title="Détail du mouvement" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-xl font-semibold text-stone-900">Détail du mouvement</h1>
                        <button
                            onClick={() => router.get(stockMovementsIndex.url())}
                            className="text-stone-400 hover:text-stone-600"
                        >
                            Retour
                        </button>
                    </div>

                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-stone-500">Ingrédient</dt>
                            <dd className="font-medium">{movement.ingredient_name}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Type</dt>
                            <dd>{movement.type === 'in' ? 'Entrée' : movement.type === 'out' ? 'Sortie' : 'Ajustement'}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Quantité</dt>
                            <dd>{movement.quantity} {movement.unit_symbol}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Prix unitaire</dt>
                            <dd>{movement.unit_price ? formatCurrency(movement.unit_price) : '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Motif</dt>
                            <dd>{movement.reason || '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Référence</dt>
                            <dd>{movement.reference || '-'}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Statut</dt>
                            <dd>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    movement.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                    movement.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                    'bg-amber-100 text-amber-700'
                                }`}>
                                    {movement.status === 'approved' ? 'Approuvé' : movement.status === 'rejected' ? 'Rejeté' : 'En attente'}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Créé par</dt>
                            <dd>{movement.created_by_name} le {movement.created_at}</dd>
                        </div>
                        {movement.approved_by_name && (
                            <>
                                <div>
                                    <dt className="text-stone-500">Approuvé par</dt>
                                    <dd>{movement.approved_by_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-stone-500">Date approbation</dt>
                                    <dd>{movement.approved_at}</dd>
                                </div>
                            </>
                        )}
                        {movement.rejection_reason && (
                            <div className="col-span-2">
                                <dt className="text-stone-500">Motif de rejet</dt>
                                <dd className="text-red-600">{movement.rejection_reason}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            </div>
        </AppLayout>
    );
}