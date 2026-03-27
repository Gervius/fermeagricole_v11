import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import TreatmentForm from '@/components/Treatments/TreatmentForm';
import { treatmentsIndex,treatmentsStore } from '@/routes';

interface Props {
    flocks: { id: number; name: string }[];
}

export default function Create({ flocks }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        flock_id: '',
        treatment_date: '',
        veterinarian: '',
        treatment_type: '',
        description: '',
        cost: '',
        invoice_reference: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(treatmentsStore.url(), {
            onSuccess: () => router.get(treatmentsIndex.url()),
        });
    };

    return (
        <AppLayout>
            <Head title="Nouveau traitement" />
            <div className="max-w-2xl mx-auto py-8 px-4">
                <div className="bg-white border border-stone-200 rounded-xl p-6">
                    <h1 className="text-xl font-semibold text-stone-900 mb-6">Nouveau traitement vétérinaire</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <TreatmentForm
                            data={data}
                            setData={(key, value) => setData(key as any, value)}
                            errors={errors}
                            flocks={flocks}
                        />
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => router.get(treatmentsIndex.url())}
                                className="flex-1 px-4 py-2 border border-stone-200 text-stone-700 text-sm rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors disabled:opacity-40"
                            >
                                Enregistrer (brouillon)
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}