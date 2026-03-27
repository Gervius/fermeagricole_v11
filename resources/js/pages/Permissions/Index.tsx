import React, { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { useToasts } from '@/components/ToastProvider';
import { permissionsIndex } from '@/routes';

export default function PermissionsIndex({ permissions, filters, flash }: PermissionsPageProps) {
    const { addToast } = useToasts();
    const [search, setSearch] = useState(filters.search || '');

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const applySearch = () => {
        router.get(permissionsIndex.url(), { search: search || undefined }, { preserveState: true, replace: true });
    };

    const resetSearch = () => {
        setSearch('');
        router.get(permissionsIndex.url(), {}, { replace: true });
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Permissions', href: permissionsIndex.url() }]}>
            <Head title="Permissions" />
            <div className="min-h-screen bg-stone-50 font-sans">

                <div className="bg-white border-b border-stone-200 px-8 py-6">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                            Permissions
                        </h1>
                        <p className="text-stone-500 text-sm mt-0.5">
                            {permissions.total} permission{permissions.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

                    {/* Recherche */}
                    <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[250px]">
                            <label className="block text-xs text-stone-500 mb-1.5 font-medium">Recherche</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applySearch()}
                                    placeholder="Nom de la permission..."
                                    className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={applySearch}
                                className="px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 transition-colors"
                            >
                                Filtrer
                            </button>
                            <button
                                onClick={resetSearch}
                                className="px-4 py-2 border border-stone-200 text-stone-600 text-sm rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    </div>

                    {/* Tableau */}
                    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-stone-100 bg-stone-50">
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Nom</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Guard</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Créé le</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {permissions.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-5 py-12 text-center text-stone-400 text-sm">
                                                Aucune permission trouvée.
                                            </td>
                                        </tr>
                                    ) : (
                                        permissions.data.map(perm => (
                                            <tr key={perm.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-5 py-4 font-medium text-stone-900">{perm.name}</td>
                                                <td className="px-5 py-4 text-stone-600">{perm.guard_name}</td>
                                                <td className="px-5 py-4 text-stone-600">{perm.created_at}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {permissions.last_page > 1 && (
                            <div className="border-t border-stone-100 px-5 py-4 flex items-center justify-between text-sm text-stone-500">
                                <span>Page {permissions.current_page} sur {permissions.last_page} — {permissions.total} résultats</span>
                                <div className="flex gap-1">
                                    <button
                                        disabled={permissions.current_page === 1}
                                        onClick={() => router.get(permissionsIndex.url(), { ...filters, page: permissions.current_page - 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={permissions.current_page === permissions.last_page}
                                        onClick={() => router.get(permissionsIndex.url(), { ...filters, page: permissions.current_page + 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}