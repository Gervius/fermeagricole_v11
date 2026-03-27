import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { TrendingUp, TrendingDown, Egg, DollarSign, AlertCircle, Activity, Building, Bell } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tableau de Bord',
        href: '/dashboard',
    },
];

interface DashboardProps {
    filters: { building_id?: number };
    buildings: { id: number; name: string }[];
    kpis: {
        active_hens: number;
        today_production: number;
        monthly_revenue: number;
    };
    alerts: {
        type: 'stock' | 'health' | 'planning';
        level: 'critical' | 'danger' | 'warning' | 'info';
        title: string;
        message: string;
    }[];
    productionChart?: { day: string; rate: number; eggs: number; feed_consumed: number; water_consumed: number }[];
    financialChart?: { month: string; sales: number; expenses: number }[];
}

import { useEffect } from 'react';

export default function Dashboard({ filters, buildings, kpis, alerts, productionChart, financialChart }: DashboardProps) {

    useEffect(() => {
        if (!productionChart || !financialChart) {
            router.reload({ only: ['productionChart', 'financialChart'] });
        }
    }, [productionChart, financialChart]);

    const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        router.get('/dashboard', { building_id: e.target.value }, { preserveState: true });
    };

    const stats = [
        {
          label: 'Poules actives',
          value: kpis.active_hens.toLocaleString('fr-FR'),
          icon: Egg,
          color: 'amber',
        },
        {
          label: "Œufs pondus (aujourd'hui)",
          value: kpis.today_production.toLocaleString('fr-FR'),
          icon: Activity,
          color: 'green',
        },
        {
          label: 'Revenus ce mois',
          value: formatCurrency(kpis.monthly_revenue),
          icon: DollarSign,
          color: 'blue',
        },
        {
          label: 'Alertes actives',
          value: alerts.length.toString(),
          icon: Bell,
          color: alerts.length > 0 ? 'red' : 'green',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tableau de Bord" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {/* Header & Filtres */}
                <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
                    <h1 className="text-xl font-semibold text-gray-900">Synthèse Globale</h1>
                    <div className="flex items-center gap-2">
                        <Building className="w-5 h-5 text-gray-400" />
                        <select
                            className="border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            value={filters.building_id || ''}
                            onChange={handleBuildingChange}
                        >
                            <option value="">Tous les bâtiments</option>
                            {buildings.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        const colorClasses = {
                            amber: 'bg-amber-50 text-amber-600',
                            green: 'bg-green-50 text-green-600',
                            blue: 'bg-blue-50 text-blue-600',
                            red: 'bg-red-50 text-red-600',
                        };
                        return(
                            <div key={stat.label} className="rounded-lg border border-gray-200 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                                <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Production Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-gray-900 mb-1 font-semibold">Performances & Suivi</h2>
                                <p className="text-sm text-gray-600">Ponte vs Consommation (Aliment & Eau)</p>
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            {productionChart ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={productionChart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis
                                            dataKey="day"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />

                                        {/* Axe Gauche : Oeufs et Eau */}
                                        <YAxis
                                            yAxisId="left"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={-10}
                                        />

                                        {/* Axe Droit : Taux de ponte (%) et Aliment (kg) */}
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="#6b7280"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            dx={10}
                                            domain={[0, 'auto']}
                                        />

                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                                        {/* Courbes principales */}
                                        <Line yAxisId="right" type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Taux de ponte (%)" />
                                        <Line yAxisId="left" type="monotone" dataKey="eggs" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Œufs produits" />

                                        {/* Courbes de consommation */}
                                        <Line yAxisId="right" type="monotone" dataKey="feed_consumed" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} name="Aliment distribué (kg)" />
                                        <Line yAxisId="left" type="monotone" dataKey="water_consumed" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} name="Eau consommée (L)" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex h-full items-center justify-center text-stone-400">Chargement des graphiques...</div>
                            )}
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="mb-6">
                            <h2 className="text-gray-900 mb-1">Analyse financière</h2>
                            <p className="text-sm text-gray-600">Ventes vs Charges (5 derniers mois)</p>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            {financialChart ? (
                                <BarChart data={financialChart}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                                    <Legend />
                                    <Bar dataKey="sales" fill="#10b981" name="Ventes" />
                                    <Bar dataKey="expenses" fill="#ef4444" name="Charges" />
                                </BarChart>
                            ) : (
                                <div className="flex h-full items-center justify-center text-stone-400">Chargement...</div>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alertes Prédictives */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-gray-900 mb-4 font-semibold">Alertes et Actions Requises</h2>
                    <div className="space-y-3">
                        {alerts.length === 0 ? (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-sm">
                                Tout semble fonctionner normalement. Aucune alerte critique.
                            </div>
                        ) : (
                            alerts.map((alert, idx) => {
                                const levelClasses = {
                                    critical: 'bg-red-50 border-red-200 text-red-900',
                                    danger: 'bg-orange-50 border-orange-200 text-orange-900',
                                    warning: 'bg-amber-50 border-amber-200 text-amber-900',
                                    info: 'bg-blue-50 border-blue-200 text-blue-900'
                                };
                                const iconColor = {
                                    critical: 'text-red-600',
                                    danger: 'text-orange-600',
                                    warning: 'text-amber-600',
                                    info: 'text-blue-600'
                                };

                                return (
                                    <div key={idx} className={`flex items-start gap-3 p-4 border rounded-lg ${levelClasses[alert.level]}`}>
                                        <AlertCircle className={`w-5 h-5 mt-0.5 ${iconColor[alert.level]}`} />
                                        <div className="flex-1">
                                            <div className="font-semibold">{alert.title}</div>
                                            <div className="text-sm mt-1 opacity-90">{alert.message}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
