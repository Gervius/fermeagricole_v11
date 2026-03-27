<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Flock;
use App\Models\DailyRecord;
use App\Models\Invoice;
use App\Models\Ingredient;
use App\Models\Treatment;
use App\Models\Building;
use App\Models\JournalEntry;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $buildingId = $request->get('building_id');

        // 1. KPIs Temps Réel (Chargement Immédiat)
        
        // Poules actives (en tenant compte du filtre bâtiment)
        $activeFlocksQuery = Flock::where('status', 'active');
        if ($buildingId) {
            $activeFlocksQuery->where('building_id', $buildingId);
        }
        $activeFlocks = $activeFlocksQuery->get();
        $totalActiveHens = $activeFlocks->sum('calculated_quantity');

        // Production du jour
        $today = Carbon::today();
        $dailyRecordsQuery = DailyRecord::whereDate('date', $today)->where('status', 'approved');
        if ($buildingId) {
            $dailyRecordsQuery->whereHas('flock', function($q) use ($buildingId) {
                $q->where('building_id', $buildingId);
            });
        }
        $todayProduction = $dailyRecordsQuery->sum('eggs');

        // Revenus du mois courant
        $startOfMonth = Carbon::now()->startOfMonth();
        $monthlyRevenue = Invoice::where('status', '!=', 'cancelled')
            ->where('status', '!=', 'draft')
            ->whereDate('date', '>=', $startOfMonth)
            ->sum('total');

        // Alertes dynamiques
        $alerts = $this->generateAlerts($buildingId);

        return Inertia::render('dashboard', [
            'filters' => ['building_id' => $buildingId],
            'buildings' => Building::select('id', 'name')->get(),
            'kpis' => [
                'active_hens' => $totalActiveHens,
                'today_production' => $todayProduction,
                'monthly_revenue' => $monthlyRevenue,
            ],
            'alerts' => $alerts,
            
            // Chargement paresseux pour les graphiques (performances)
            'productionChart' => Inertia::lazy(fn () => $this->getProductionChartData($buildingId)),
            'financialChart' => Inertia::lazy(fn () => $this->getFinancialChartData()),
        ]);
    }

    private function generateAlerts($buildingId)
    {
        $alerts = [];

        // Alerte Stock (Ingrédients sous le seuil min)
        $lowStockIngredients = Ingredient::whereNotNull('min_stock')
            ->whereColumn('current_stock', '<=', 'min_stock')
            ->get();

        foreach ($lowStockIngredients as $ing) {
            $alerts[] = [
                'type' => 'stock',
                'level' => 'critical',
                'title' => "Rupture de stock imminente",
                'message' => "Le stock de {$ing->name} est de {$ing->current_stock} {$ing->defaultUnit->symbol} (Seuil: {$ing->min_stock}).",
            ];
        }

        // Alerte Sanitaire (Mortalité > 2% hier ou aujourd'hui)
        $recentRecords = DailyRecord::with('flock')
            ->where('date', '>=', Carbon::yesterday())
            ->where('status', 'approved');
            
        if ($buildingId) {
            $recentRecords->whereHas('flock', function($q) use ($buildingId) {
                $q->where('building_id', $buildingId);
            });
        }

        foreach ($recentRecords->get() as $record) {
            $flock = $record->flock;
            // On calcule sur l'effectif initial pour la règle stricte, ou effectif actuel
            $mortalityRate = ($record->losses / max(1, $flock->current_quantity)) * 100;

            
            if ($mortalityRate > 2) {
                $alerts[] = [
                    'type' => 'health',
                    'level' => 'danger',
                    'title' => "Alerte Mortalité Anormale",
                    'message' => "Le lot '{$flock->name}' a enregistré " . number_format($mortalityRate, 1) . "% de pertes le " . $record->date->format('d/m/Y') . ".",
                ];
            }
        }

        // Alerte Planning (Traitements prévus demain)
        $tomorrow = Carbon::tomorrow();
        $treatments = Treatment::with('flock')->whereDate('treatment_date', $tomorrow)->get();
        foreach ($treatments as $treatment) {
            if (!$buildingId || ($treatment->flock && $treatment->flock->building_id == $buildingId)) {
                $alerts[] = [
                    'type' => 'planning',
                    'level' => 'warning',
                    'title' => "Traitement programmé demain",
                    'message' => "Soin '{$treatment->treatment_type}' prévu pour le lot '{$treatment->flock->name}'.",
                ];
            }
        }

        return $alerts;
    }

    private function getProductionChartData($buildingId)
    {
        $startDate = Carbon::today()->subDays(6);
        $data = [];
        
        for ($i = 0; $i < 7; $i++) {
            $currentDate = $startDate->copy()->addDays($i);
            
            // On récupère les records du jour
            $query = DailyRecord::whereDate('date', $currentDate)->where('status', 'approved');
            if ($buildingId) {
                $query->whereHas('flock', fn($q) => $q->where('building_id', $buildingId));
            }
            $eggs = (clone $query)->sum('eggs');
            $feedConsumed = (clone $query)->sum('feed_consumed'); // Total feed in kg
            $waterConsumed = (clone $query)->sum('water_consumed'); // Total water in L

            // On estime le nombre de poules actives à cette date (simplification : on prend le count actuel des lots actifs)
            // Pour une précision absolue, il faudrait historiser l'effectif quotidien.
            $activeFlocksQuery = Flock::where('status', 'active')->where('arrival_date', '<=', $currentDate);
            if ($buildingId) {
                $activeFlocksQuery->where('building_id', $buildingId);
            }
            $activeHens = $activeFlocksQuery->get()->sum('calculated_quantity');

            $rate = $activeHens > 0 ? ($eggs / $activeHens) * 100 : 0;

            $data[] = [
                'day' => $currentDate->format('D'), // ex: Lun, Mar
                'rate' => round($rate, 1),
                'eggs' => $eggs,
                'feed_consumed' => round($feedConsumed, 2),
                'water_consumed' => round($waterConsumed, 2),
            ];
        }

        return $data;
    }

    private function getFinancialChartData()
    {
        $data = [];
        // 5 derniers mois (y compris le mois en cours)
        for ($i = 4; $i >= 0; $i--) {
            $monthStart = Carbon::now()->startOfMonth()->subMonths($i);
            $monthEnd = $monthStart->copy()->endOfMonth();

            // Ventes : Total des factures non annulées/draft
            $sales = Invoice::whereNotIn('status', ['draft', 'cancelled'])
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->sum('total');

            // Charges : JournalEntries liées à des comptes de charge (classe 6 en général SYSCOHADA)
            $expenses = JournalEntry::whereHas('account', function($q) {
                    $q->where('type', 'expense')->orWhere('code', 'like', '6%');
                })
                ->whereHas('voucher', function($q) use ($monthStart, $monthEnd) {
                    $q->where('status', 'posted')->whereBetween('date', [$monthStart, $monthEnd]);
                })
                ->sum('debit');

            // Si le journal comptable n'est pas encore bien rempli, on fallback sur les traitements
            if ($expenses == 0) {
                $expenses = Treatment::where('status', 'approved')
                    ->whereBetween('treatment_date', [$monthStart, $monthEnd])
                    ->sum('cost');
            }

            $data[] = [
                'month' => $monthStart->locale('fr')->isoFormat('MMM'), // ex: Jan, Fév
                'sales' => $sales,
                'expenses' => $expenses,
            ];
        }

        return $data;
    }
}
