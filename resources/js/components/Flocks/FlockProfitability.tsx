import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FinancialData {
    costs: {
        purchase: number;
        veterinary: number;
        feed_and_other: number;
        total: number;
    };
    revenues: {
        eggs: number;
        reforms: number;
        total: number;
    };
    kpis: {
        gross_margin: number;
        profitability_index: number;
        break_even_trays: number;
        status: 'profitable' | 'amortizing';
    };
    waterfall_data: {
        name: string;
        amount: number;
        isTotal?: boolean;
    }[];
}

interface Props {
    data: FinancialData;
}

export default function FlockProfitability({ data }: Props) {

    const { kpis, costs, revenues, waterfall_data } = data;

    // Préparation des données du Waterfall pour Recharts
    let runningTotal = 0;
    const chartData = waterfall_data.map((item, index) => {
        if (item.isTotal) {
            return {
                name: item.name,
                transparent: 0,
                val: item.amount,
                fill: item.amount >= 0 ? '#10b981' : '#ef4444', // Vert ou Rouge
            };
        }

        const previousTotal = runningTotal;
        runningTotal += item.amount;

        return {
            name: item.name,
            transparent: item.amount < 0 ? runningTotal : previousTotal,
            val: Math.abs(item.amount),
            fill: item.amount < 0 ? '#ef4444' : '#10b981', // Dépenses = Rouge, Entrées = Vert
            isExpense: item.amount < 0,
            originalAmount: item.amount,
        };
    });

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const value = data.isTotal !== undefined ? data.val : data.originalAmount;
            return (
                <div className="bg-white border border-stone-200 p-3 rounded-lg shadow-lg text-sm">
                    <p className="font-semibold text-stone-900 mb-1">{label}</p>
                    <p className={value >= 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                        {formatCurrency(value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">

            {/* Header KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-2xl border ${kpis.status === 'profitable' ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'} flex items-start justify-between`}>
                    <div>
                        <p className={`text-sm font-medium ${kpis.status === 'profitable' ? 'text-emerald-800' : 'text-orange-800'} mb-1`}>Marge Brute</p>
                        <h3 className={`text-2xl font-bold ${kpis.status === 'profitable' ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {formatCurrency(kpis.gross_margin)}
                        </h3>
                        <p className={`text-xs font-semibold mt-2 inline-block px-2 py-1 rounded-full ${kpis.status === 'profitable' ? 'bg-emerald-200 text-emerald-900' : 'bg-orange-200 text-orange-900'}`}>
                            {kpis.status === 'profitable' ? 'Bénéficiaire' : 'En cours d\'amortissement'}
                        </p>
                    </div>
                    {kpis.status === 'profitable' ? <TrendingUp className="w-6 h-6 text-emerald-500" /> : <TrendingDown className="w-6 h-6 text-orange-500" />}
                </div>

                <div className="p-5 rounded-2xl border bg-white border-stone-200 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-stone-500 mb-1">Indice de Rentabilité</p>
                        <h3 className="text-2xl font-bold text-stone-900">
                            {kpis.profitability_index.toFixed(2)}x
                        </h3>
                        <p className="text-xs text-stone-400 mt-2">Revenus / Charges</p>
                    </div>
                    <Banknote className="w-6 h-6 text-indigo-400" />
                </div>

                <div className="p-5 rounded-2xl border bg-white border-stone-200 flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-stone-500 mb-1">Seuil de rentabilité</p>
                        <h3 className="text-2xl font-bold text-stone-900">
                            {kpis.break_even_trays > 0 ? kpis.break_even_trays.toLocaleString('fr-FR') : '0'} plateaux
                        </h3>
                        <p className="text-xs text-stone-400 mt-2">Restants à vendre pour amortir</p>
                    </div>
                    <Target className="w-6 h-6 text-sky-400" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tableau Comparatif */}
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-stone-100 bg-stone-50">
                        <h3 className="font-semibold text-stone-900">Répartition Financière</h3>
                    </div>
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-stone-100">
                            <tr className="bg-red-50/30">
                                <td className="px-5 py-3 text-stone-600">Achat initial</td>
                                <td className="px-5 py-3 text-right font-medium text-red-600">-{formatCurrency(costs.purchase)}</td>
                            </tr>
                            <tr className="bg-red-50/30">
                                <td className="px-5 py-3 text-stone-600">Alimentation</td>
                                <td className="px-5 py-3 text-right font-medium text-red-600">-{formatCurrency(costs.feed_and_other)}</td>
                            </tr>
                            <tr className="bg-red-50/30">
                                <td className="px-5 py-3 text-stone-600">Frais Vétérinaires</td>
                                <td className="px-5 py-3 text-right font-medium text-red-600">-{formatCurrency(costs.veterinary)}</td>
                            </tr>
                            <tr className="bg-stone-50 font-bold border-t-2 border-stone-200">
                                <td className="px-5 py-3 text-stone-900">Total Charges</td>
                                <td className="px-5 py-3 text-right text-red-700">-{formatCurrency(costs.total)}</td>
                            </tr>

                            <tr className="bg-emerald-50/30">
                                <td className="px-5 py-3 text-stone-600">Ventes d'œufs estim.</td>
                                <td className="px-5 py-3 text-right font-medium text-emerald-600">+{formatCurrency(revenues.eggs)}</td>
                            </tr>
                            <tr className="bg-emerald-50/30">
                                <td className="px-5 py-3 text-stone-600">Vente réformes</td>
                                <td className="px-5 py-3 text-right font-medium text-emerald-600">+{formatCurrency(revenues.reforms)}</td>
                            </tr>
                            <tr className="bg-stone-50 font-bold border-t-2 border-stone-200">
                                <td className="px-5 py-3 text-stone-900">Total Revenus</td>
                                <td className="px-5 py-3 text-right text-emerald-700">+{formatCurrency(revenues.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Graphique en Cascade */}
                <div className="lg:col-span-2 bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col">
                    <h3 className="font-semibold text-stone-900 mb-6">Évolution de la rentabilité (Cascade)</h3>
                    <div className="flex-1 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />

                                {/* Barre invisible pour créer l'effet d'empilement (Cascade) */}
                                <Bar dataKey="transparent" stackId="a" fill="transparent" />

                                {/* Barre colorée pour la valeur */}
                                <Bar dataKey="val" stackId="a" radius={[2, 2, 2, 2]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}