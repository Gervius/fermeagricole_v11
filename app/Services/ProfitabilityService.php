<?php

namespace App\Services;

use App\Models\Flock;
use App\Models\AnalyticalAccount;

class ProfitabilityService
{
    /**
     * Calcule la rentabilité financière complète d'un lot.
     */
    public function calculateForFlock(Flock $flock): array
    {
        // 1. Récupérer ou créer le compte analytique associé à ce lot
        $analyticalAccount = AnalyticalAccount::firstOrCreate(
            [
                'target_id' => $flock->id,
                'target_type' => Flock::class,
            ],
            [
                'code' => 'LOT-' . $flock->id,
                'name' => 'Lot: ' . $flock->name,
                'is_active' => true,
            ]
        );

        // 2. Agrégation des Coûts Directs
        $initialPurchaseCost = (float) $flock->purchase_cost; // Achat des poules (ou poussins)
        
        // Coûts issus de la comptabilité analytique (ex: Alimentation, Frais véto liés spécifiquement au lot)
        // On somme les montants des allocations analytiques liées à des comptes de classe 6 (Charges)
        $expenseAllocations = $analyticalAccount->allocations()
            ->whereHas('journalEntry.account', function ($q) {
                $q->where('type', 'expense')->orWhere('code', 'like', '6%');
            })->sum('amount');
            
        // Fallback si la comptabilité analytique n'est pas encore saisie : on utilise les relations directes
        $feedCost = 0; // TODO: Si les consommations d'aliments sont rattachées au lot (actuellement pas de lien direct dans le modèle, on devrait le traquer via les distributions)
        
        $vetCost = $flock->treatments()->where('status', 'approved')->sum('cost');

        // On utilise la compta analytique si elle existe, sinon on additionne le coût vétérinaire
        $operationalCosts = $expenseAllocations > 0 ? $expenseAllocations : $vetCost;
        
        $totalCosts = $initialPurchaseCost + $operationalCosts;


        // 3. Agrégation des Revenus
        // On récupère toutes les factures (InvoiceItems) où ce lot a été vendu (Réformes)
        $flockSalesRevenue = $flock->invoiceItems()->with('invoice')->get()->sum(function ($item) {
            return $item->invoice->status === 'approved' ? $item->total : 0;
        });

        // Ventes d'œufs : Puisque les oeufs ne sont pas directement liés à un lot dans invoiceItems (ils sortent d'un stock global), 
        // on estime la part de revenu des oeufs de CE lot. 
        // Formule : (Total Œufs du Lot / Total Œufs Pondus Ferme) * Total Revenus Œufs
        // Ou, plus simple : Valorisation théorique : Total Œufs du lot * Prix moyen de vente d'un oeuf
        
        $totalEggsProducedByFlock = $flock->dailyRecords()->where('status', 'approved')->sum('eggs');
        
        // Trouver le prix de vente moyen d'un oeuf (à partir des factures globales)
        $totalEggSalesRevenue = \App\Models\InvoiceItem::where('itemable_type', 'App\Models\EggMovement')
            ->whereHas('invoice', fn($q) => $q->where('status', 'approved'))
            ->sum('total');
        $totalEggQuantitySold = \App\Models\InvoiceItem::where('itemable_type', 'App\Models\EggMovement')
            ->whereHas('invoice', fn($q) => $q->where('status', 'approved'))
            ->sum('quantity');
        
        // On suppose que la quantité vendue est en "plateaux" de 30 oeufs, on adapte le calcul
        // Si quantity = nombre d'unités (ex: 1 plateau), on va le simplifier
        $averagePricePerEgg = 0;
        if ($totalEggQuantitySold > 0) {
            // Hypothèse : quantity = plateaux de 30.
            $averagePricePerEgg = $totalEggSalesRevenue / ($totalEggQuantitySold * 30);
        } else {
            // Prix par défaut fallback (ex: 75 FCFA l'oeuf)
            $averagePricePerEgg = 75;
        }

        $estimatedEggRevenue = $totalEggsProducedByFlock * $averagePricePerEgg;
        
        $totalRevenues = $flockSalesRevenue + $estimatedEggRevenue;

        // 4. Calcul des KPIs
        $grossMargin = $totalRevenues - $totalCosts;
        $profitabilityIndex = $totalCosts > 0 ? ($totalRevenues / $totalCosts) : 0;
        
        // Seuil de rentabilité (Combien de plateaux d'oeufs restent à vendre pour couvrir le coût initial)
        // Prix d'un plateau (30 oeufs)
        $pricePerTray = $averagePricePerEgg * 30;
        $remainingCostToCover = max(0, $initialPurchaseCost - $estimatedEggRevenue);
        $breakEvenTrays = $pricePerTray > 0 ? ceil($remainingCostToCover / $pricePerTray) : 0;

        return [
            'costs' => [
                'purchase' => round($initialPurchaseCost, 2),
                'veterinary' => round($vetCost, 2),
                'feed_and_other' => round(max(0, $operationalCosts - $vetCost), 2), // Différence analytique
                'total' => round($totalCosts, 2)
            ],
            'revenues' => [
                'eggs' => round($estimatedEggRevenue, 2),
                'reforms' => round($flockSalesRevenue, 2),
                'total' => round($totalRevenues, 2)
            ],
            'kpis' => [
                'gross_margin' => round($grossMargin, 2),
                'profitability_index' => round($profitabilityIndex, 2),
                'break_even_trays' => $breakEvenTrays,
                'status' => $grossMargin >= 0 ? 'profitable' : 'amortizing', // Bénéficiaire vs En cours d'amortissement
            ],
            'waterfall_data' => [
                ['name' => 'Investissement', 'amount' => -$initialPurchaseCost],
                ['name' => 'Frais Vétérinaires', 'amount' => -$vetCost],
                ['name' => 'Alimentation & Autres', 'amount' => -max(0, $operationalCosts - $vetCost)],
                ['name' => 'Ventes d\'Œufs', 'amount' => $estimatedEggRevenue],
                ['name' => 'Vente Réformes', 'amount' => $flockSalesRevenue],
                ['name' => 'Résultat', 'amount' => $grossMargin, 'isTotal' => true],
            ]
        ];
    }
}