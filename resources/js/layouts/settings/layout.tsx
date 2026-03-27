import React from 'react';
import { Link } from '@inertiajs/react';
import { cn, isSameUrl, resolveUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit } from '@/routes/profile';
//import { show } from '@/routes/two-facto';
import { edit as editPassword } from '@/routes/security';
import {
    User, Lock, Shield, Palette, Building2, Weight, KeySquare,
    BookOpen, Users, Cookie, Settings as SettingsIcon, ShieldCheck
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { accountingRulesIndex, accountsIndex, buildingsIndex, ingredientsIndex, unitsIndex, usersIndex } from '@/routes';

interface NavSection {
    title: string;
    items: {
        title: string;
        href: string;
        icon: any;
    }[];
}

const navSections: NavSection[] = [
    {
        title: 'Infrastructure',
        items: [
            { title: 'Bâtiments', href: buildingsIndex(), icon: Building2 },
        ]
    },
    {
        title: 'Référentiels',
        items: [
            { title: 'Unités de mesure', href: unitsIndex(), icon: Weight },
            { title: 'Catalogue d\'ingrédients', href: ingredientsIndex(), icon: Cookie },
        ]
    },
    {
        title: 'Finance',
        items: [
            { title: 'Plan comptable', href: accountsIndex(), icon: BookOpen },
            { title: 'Plan comptable', href: accountingRulesIndex(), icon: BookOpen },
        ]
    },
    {
        title: 'Sécurité & Accès',
        items: [
            { title: 'Utilisateurs', href: usersIndex(), icon: Users },
            { title: 'Rôles & Permissions', href: '/settings/roles', icon: ShieldCheck },
        ]
    },
    {
        title: 'Mon Compte',
        items: [
            { title: 'Profil', href: edit(), icon: User },
            { title: 'Mot de passe', href: editPassword(), icon: Lock },
            
            { title: 'Apparence', href: editAppearance(), icon: Palette },
        ]
    }
];

export default function SettingsLayout({ children, breadcrumbs = [] }: { children: React.ReactNode, breadcrumbs?: any[] }) {
    if (typeof window === 'undefined') return null;

    const currentPath = window.location.pathname;

    return (
        <AppLayout breadcrumbs={[{ title: 'Paramètres', href: '/settings' }, ...breadcrumbs]}>
            <div className="min-h-screen bg-stone-50 font-sans pb-12">
                <div className="bg-white border-b border-stone-200 px-8 py-6 mb-8">
                    <div className="max-w-7xl mx-auto flex items-center gap-3">
                        <SettingsIcon className="w-7 h-7 text-stone-400" />
                        <div>
                            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Paramètres du système</h1>
                            <p className="text-stone-500 text-sm mt-1">Gérez l'infrastructure, les référentiels, la finance et la sécurité.</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Navigation */}
                        <aside className="w-full lg:w-64 shrink-0">
                            <nav className="space-y-8">
                                {navSections.map((section, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3 px-3">
                                            {section.title}
                                        </h3>
                                        <div className="space-y-1">
                                            {section.items.map((item, itemIdx) => {
                                                const isActive = isSameUrl(currentPath, item.href);
                                                const Icon = item.icon;
                                                return (
                                                    <Link
                                                        key={`${item.href}-${itemIdx}`}
                                                        href={item.href}
                                                        className={cn(
                                                            'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                                                            isActive
                                                                ? 'bg-amber-100 text-amber-900'
                                                                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                                                        )}
                                                    >
                                                        <Icon className={cn("w-4 h-4", isActive ? "text-amber-700" : "text-stone-400")} />
                                                        {item.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </nav>
                        </aside>

                        {/* Main Content Area */}
                        <main className="flex-1 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}


