import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Plus, Search, Edit2, Trash2, Download, Building2, User, Truck, X } from 'lucide-react';
import { useToasts } from '@/components/ToastProvider';
import { formatCurrency } from '@/lib/utils';
import { partnersIndex, partnersStore, partnersUpdate, partnersDestroy } from '@/routes';

interface Partner {
    id: number;
    name: string;
    type: 'customer' | 'supplier' | 'both';
    phone: string | null;
    email: string | null;
    address: string | null;
    is_active: boolean;
    balance: number;
}

interface Props {
    partners: {
        data: Partner[];
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
        type?: string;
    };
    flash?: { success?: string; error?: string };
}

export default function Index({ partners, filters, flash }: Props) {
    const { addToast } = useToasts();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const { data, setData, post, put, reset, processing, errors, clearErrors } = useForm({
        name: '',
        type: 'customer',
        phone: '',
        email: '',
        address: '',
        is_active: true,
    });

    useEffect(() => {
        if (flash?.success) addToast({ message: flash.success, type: 'success' });
        if (flash?.error) addToast({ message: flash.error, type: 'error' });
    }, [flash]);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get(partnersIndex.url(), {
            search: formData.get('search'),
            type: formData.get('type')
        }, { preserveState: true });
    };

    const openCreateModal = () => {
        reset();
        clearErrors();
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (partner: Partner) => {
        clearErrors();
        setData({
            name: partner.name,
            type: partner.type,
            phone: partner.phone || '',
            email: partner.email || '',
            address: partner.address || '',
            is_active: partner.is_active,
        });
        setEditingId(partner.id);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            router.put(partnersUpdate.url(editingId), data as any, {
                preserveScroll: true,
                onSuccess: () => closeModal()
            });
        } else {
            router.post(partnersStore.url(), data as any, {
                preserveScroll: true,
                onSuccess: () => closeModal()
            });
        }
    };

    const handleDelete = (partner: Partner) => {
        if (confirm(`Supprimer le partenaire "${partner.name}" ?`)) {
            router.delete(partnersDestroy.url(partner.id));
        }
    };

    const getTypeLabel = (type: string) => {
        switch(type) {
            case 'customer': return <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium border border-emerald-100"><User className="w-3 h-3" /> Client</span>;
            case 'supplier': return <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-medium border border-blue-100"><Truck className="w-3 h-3" /> Fournisseur</span>;
            case 'both': return <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-md text-xs font-medium border border-purple-100"><Building2 className="w-3 h-3" /> Mixte</span>;
            default: return type;
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Tiers & Partenaires', href: partnersIndex.url() }]}>
            <Head title="Gestion des Partenaires" />
            <div className="min-h-screen bg-stone-50 font-sans pb-12">

                {/* Header */}
                <div className="bg-white border-b border-stone-200 px-8 py-6">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight flex items-center gap-2">
                                <Building2 className="w-6 h-6 text-stone-400" />
                                Tiers & Partenaires
                            </h1>
                            <p className="text-stone-500 text-sm mt-1">Gérez vos clients, fournisseurs et leurs soldes.</p>
                        </div>
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4" /> Nouveau Partenaire
                        </button>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">

                    {/* Filters */}
                    <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
                        <form onSubmit={handleSearch} className="flex-1 flex gap-3 w-full">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    name="search"
                                    defaultValue={filters.search}
                                    placeholder="Nom, Téléphone, Email..."
                                    className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                                />
                            </div>
                            <select
                                name="type"
                                defaultValue={filters.type}
                                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">Tous les types</option>
                                <option value="customer">Clients</option>
                                <option value="supplier">Fournisseurs</option>
                                <option value="both">Mixte</option>
                            </select>
                            <button type="submit" className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors border border-stone-200">
                                Rechercher
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider font-semibold border-b border-stone-200">
                                    <tr>
                                        <th className="px-6 py-4">Nom / Contact</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4 text-right">Solde Actuel</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {partners.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-stone-500">
                                                Aucun partenaire trouvé.
                                            </td>
                                        </tr>
                                    ) : (
                                        partners.data.map(partner => (
                                            <tr key={partner.id} className={`hover:bg-stone-50 transition-colors ${!partner.is_active ? 'opacity-50' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-stone-900 text-base">{partner.name} {!partner.is_active && '(Inactif)'}</div>
                                                    <div className="text-xs text-stone-500 mt-1 flex gap-3">
                                                        {partner.phone && <span>{partner.phone}</span>}
                                                        {partner.email && <span>{partner.email}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getTypeLabel(partner.type)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold border ${partner.balance > 0 ? 'bg-red-50 text-red-700 border-red-200' : (partner.balance < 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-stone-100 text-stone-600 border-stone-200')}`}>
                                                        {formatCurrency(Math.abs(partner.balance))}
                                                        <span className="ml-1 text-[10px] font-normal opacity-80 uppercase tracking-wider">
                                                            {partner.balance > 0 ? 'Dû (Débiteur)' : (partner.balance < 0 ? 'Avoir (Créditeur)' : '')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a
                                                            href={`/partners/${partner.id}/statement`}
                                                            target="_blank"
                                                            title="Télécharger le relevé (3 derniers mois)"
                                                            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => openEditModal(partner)}
                                                            className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(partner)}
                                                            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
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
                    </div>

                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50">
                            <h3 className="text-lg font-medium text-stone-900">
                                {editingId ? 'Modifier le partenaire' : 'Nouveau partenaire'}
                            </h3>
                            <button onClick={closeModal} className="text-stone-400 hover:text-stone-600 p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Nom complet *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-lg border-stone-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                                    required
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Type de Tiers *</label>
                                    <select
                                        value={data.type}
                                        onChange={e => setData('type', e.target.value)}
                                        className="w-full rounded-lg border-stone-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                                    >
                                        <option value="customer">Client</option>
                                        <option value="supplier">Fournisseur</option>
                                        <option value="both">Mixte (Les deux)</option>
                                    </select>
                                    {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Téléphone</label>
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        placeholder="+226..."
                                        className="w-full rounded-lg border-stone-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full rounded-lg border-stone-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Adresse</label>
                                <textarea
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    rows={2}
                                    className="w-full rounded-lg border-stone-300 focus:border-amber-500 focus:ring-amber-500 sm:text-sm resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-600"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-stone-700">Compte Actif</label>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50"
                                >
                                    {editingId ? 'Mettre à jour' : 'Créer le partenaire'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}