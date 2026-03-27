import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { feedProductionsIndex } from '@/routes';

interface Props {
    production: {
        id: number;
        date: string;
        recipe_name: string;
        quantity: number;
        unit: string;
        notes: string | null;
        status: string;
        created_by_name: string;
        created_at: string;
        approved_by_name: string | null;
        approved_at: string | null;
        rejection_reason: string | null;
        ingredients_used?: { name: string; quantity: number; unit: string }[]; // optionnel
    };
}

export default function Show({ production }: Props) {
    return (
        <AppLayout breadcrumbs={[{ title: 'Détail production', href: '#' }]}>
            <Head title="Détail de la production" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-6">
                        <h1 className="text-xl font-semibold text-stone-900">Détail de la production</h1>
                        <button
                            onClick={() => router.get(feedProductionsIndex.url())}
                            className="text-stone-400 hover:text-stone-600"
                        >
                            Retour
                        </button>
                    </div>

                    <dl className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <dt className="text-stone-500">Date</dt>
                            <dd className="font-medium">{new Date(production.date).toLocaleDateString('fr-FR')}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Recette</dt>
                            <dd>{production.recipe_name}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Quantité</dt>
                            <dd>{production.quantity} {production.unit}</dd>
                        </div>
                        <div>
                            <dt className="text-stone-500">Statut</dt>
                            <dd>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    production.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                    production.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                    production.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                    {production.status === 'approved' ? 'Approuvé' :
                                     production.status === 'rejected' ? 'Rejeté' :
                                     production.status === 'pending' ? 'En attente' : 'Brouillon'}
                                </span>
                            </dd>
                        </div>
                        {production.notes && (
                            <div className="col-span-2">
                                <dt className="text-stone-500">Notes</dt>
                                <dd className="mt-1 whitespace-pre-line text-stone-700">{production.notes}</dd>
                            </div>
                        )}
                        <div>
                            <dt className="text-stone-500">Créé par</dt>
                            <dd>{production.created_by_name} le {production.created_at}</dd>
                        </div>
                        {production.approved_by_name && (
                            <>
                                <div>
                                    <dt className="text-stone-500">Approuvé par</dt>
                                    <dd>{production.approved_by_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-stone-500">Date approbation</dt>
                                    <dd>{production.approved_at}</dd>
                                </div>
                            </>
                        )}
                        {production.rejection_reason && (
                            <div className="col-span-2">
                                <dt className="text-stone-500">Motif de rejet</dt>
                                <dd className="text-red-600">{production.rejection_reason}</dd>
                            </div>
                        )}
                    </dl>

                    {production.ingredients_used && production.ingredients_used.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-stone-700 mb-2">Ingrédients utilisés :</h3>
                            <table className="w-full text-xs">
                                <thead className="bg-stone-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Ingrédient</th>
                                        <th className="px-3 py-2 text-right">Quantité</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {production.ingredients_used.map((ing, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-1.5">{ing.name}</td>
                                            <td className="px-3 py-1.5 text-right">{ing.quantity} {ing.unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}