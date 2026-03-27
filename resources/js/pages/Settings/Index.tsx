import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import SettingsLayout from '@/layouts/settings/layout';

interface Setting {
    key: string;
    value: any;
    type: string;
    description: string | null;
}

interface SettingsProps {
    settings: Record<string, Setting>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Paramètres généraux',
        href: '/settings/general',
    },
];

export default function SettingsIndex({ settings }: SettingsProps) {
    const { data, setData, post, processing, recentlySuccessful } = useForm({
        settings: [
            {
                key: 'taux_perte_autorise',
                value: settings['taux_perte_autorise']?.value || '2',
                type: 'float',
                description: 'Taux de perte autorisé par défaut (%)',
            },
            {
                key: 'seuil_alerte_stock',
                value: settings['seuil_alerte_stock']?.value || '100',
                type: 'integer',
                description: 'Seuil d\'alerte pour le stock minimum (kg/unités)',
            },
            {
                key: 'activer_pmp',
                value: settings['activer_pmp']?.value == '1' ? true : false,
                type: 'boolean',
                description: 'Activer le calcul automatique du Prix Moyen Pondéré (PMP)',
            },
            {
                key: 'methode_amortissement',
                value: settings['methode_amortissement']?.value || 'lineaire',
                type: 'string',
                description: "Méthode d'amortissement (lineaire ou volume)",
            },
            {
                key: 'duree_amortissement_mois',
                value: settings['duree_amortissement_mois']?.value || '18',
                type: 'integer',
                description: "Durée d'amortissement standard en mois",
            }
        ],
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('settings.update'), {
            preserveScroll: true,
        });
    };

    const handleSettingChange = (key: string, value: any) => {
        setData('settings', data.settings.map((s) => s.key === key ? { ...s, value } : s));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paramètres généraux" />
            <SettingsLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">Paramètres de l'ERP</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Gérez les variables globales, les seuils d'alerte et les règles comptables de votre ferme.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        {/* Paramètres d'Élevage */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Paramètres d'élevage</CardTitle>
                                <CardDescription>Configuration des seuils et taux pour les lots et stocks.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="taux_perte_autorise">Taux de perte autorisé (%)</Label>
                                    <Input
                                        id="taux_perte_autorise"
                                        type="number"
                                        step="0.01"
                                        value={data.settings.find(s => s.key === 'taux_perte_autorise')?.value as string}
                                        onChange={(e) => handleSettingChange('taux_perte_autorise', e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="seuil_alerte_stock">Seuil d'alerte stock</Label>
                                    <Input
                                        id="seuil_alerte_stock"
                                        type="number"
                                        value={data.settings.find(s => s.key === 'seuil_alerte_stock')?.value as string}
                                        onChange={(e) => handleSettingChange('seuil_alerte_stock', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Paramètres Financiers & Comptables */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Finance & Comptabilité</CardTitle>
                                <CardDescription>Règles de calcul du PMP et amortissement.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between space-x-2">
                                    <div className="flex flex-col space-y-1">
                                        <Label htmlFor="activer_pmp">Activer le calcul PMP automatique</Label>
                                        <span className="text-sm text-gray-500">
                                            Mise à jour du PMP des ingrédients lors de l'enregistrement d'une facture d'achat.
                                        </span>
                                    </div>
                                    <Switch
                                        id="activer_pmp"
                                        checked={data.settings.find(s => s.key === 'activer_pmp')?.value as boolean}
                                        onCheckedChange={(checked) => handleSettingChange('activer_pmp', checked)}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="methode_amortissement">Méthode d'amortissement</Label>
                                    <select
                                        id="methode_amortissement"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={data.settings.find(s => s.key === 'methode_amortissement')?.value as string}
                                        onChange={(e) => handleSettingChange('methode_amortissement', e.target.value)}
                                    >
                                        <option value="lineaire">Linéaire</option>
                                        <option value="volume">Par volume (oeufs produits)</option>
                                    </select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="duree_amortissement_mois">Durée d'amortissement standard (mois)</Label>
                                    <Input
                                        id="duree_amortissement_mois"
                                        type="number"
                                        value={data.settings.find(s => s.key === 'duree_amortissement_mois')?.value as string}
                                        onChange={(e) => handleSettingChange('duree_amortissement_mois', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={processing}>
                                Enregistrer les paramètres
                            </Button>
                            {recentlySuccessful && <p className="text-sm text-gray-600">Enregistré.</p>}
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
