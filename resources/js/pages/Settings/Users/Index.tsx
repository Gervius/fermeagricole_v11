import React, { useState, useEffect } from 'react';
import { router, Head } from '@inertiajs/react';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight, Search, Eye } from 'lucide-react';
import SettingsLayout from '@/layouts/settings/layout';
import { Role, User, UsersPageProps } from '@/types';
import { useToasts } from '@/components/ToastProvider';
import { usersIndex, usersCreate, usersEdit, usersDestroy } from '@/routes';

export default function UsersIndex({ users, roles, filters, flash }: UsersPageProps) {
    const { addToast } = useToasts();
    const [search, setSearch] = useState(filters.search || '');

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const applySearch = () => {
        router.get(usersIndex.url(), { search: search || undefined }, { preserveState: true, replace: true });
    };

    const resetSearch = () => {
        setSearch('');
        router.get(usersIndex.url(), {}, { replace: true });
    };

    const handleDelete = (user: User) => {
        if (!confirm(`Supprimer l'utilisateur "${user.name}" ?`)) return;
        router.delete(usersDestroy.url(user.id));
    };

    return (
        <SettingsLayout breadcrumbs={[{ title: 'Utilisateurs', href: usersIndex.url() }]}>
            <Head title="Utilisateurs" />
            <div className="bg-white rounded-xl">

                <div className="px-8 py-6 border-b border-stone-200">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
                                Utilisateurs
                            </h1>
                            <p className="text-stone-500 text-sm mt-0.5">
                                {users.total} utilisateur{users.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <button
                            onClick={() => router.get(usersCreate.url())}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Nouvel utilisateur
                        </button>
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
                                    placeholder="Nom ou email..."
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
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Email</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Rôles</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Créé le</th>
                                        <th className="px-5 py-3.5 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {users.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-12 text-center text-stone-400 text-sm">
                                                Aucun utilisateur trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        users.data.map(user => (
                                            <tr key={user.id} className="hover:bg-stone-50 transition-colors">
                                                <td className="px-5 py-4 font-medium text-stone-900">{user.name}</td>
                                                <td className="px-5 py-4 text-stone-600">{user.email}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.map(role => (
                                                            <span key={role} className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full text-xs">
                                                                {role}
                                                            </span>
                                                        ))}
                                                        {user.roles.length === 0 && <span className="text-stone-400 text-xs">Aucun rôle</span>}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-stone-600">{user.created_at}</td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => router.get(usersEdit.url(user.id))}
                                                            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                            title="Modifier"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user)}
                                                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Supprimer"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {users.last_page > 1 && (
                            <div className="border-t border-stone-100 px-5 py-4 flex items-center justify-between text-sm text-stone-500">
                                <span>Page {users.current_page} sur {users.last_page} — {users.total} résultats</span>
                                <div className="flex gap-1">
                                    <button
                                        disabled={users.current_page === 1}
                                        onClick={() => router.get(usersIndex.url(), { ...filters, page: users.current_page - 1 })}
                                        className="p-1.5 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        disabled={users.current_page === users.last_page}
                                        onClick={() => router.get(usersIndex.url(), { ...filters, page: users.current_page + 1 })}
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
        </SettingsLayout>
    );
}