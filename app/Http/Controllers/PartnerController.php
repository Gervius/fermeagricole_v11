<?php

namespace App\Http\Controllers;

use App\Models\Partner;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class PartnerController extends Controller
{
    public function index(Request $request)
    {
        $query = Partner::query()
            ->when($request->search, function ($q, $search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->type, fn($q, $type) => $q->where('type', $type));

        $partners = $query->latest()->paginate(15)->through(fn($partner) => [
            'id' => $partner->id,
            'name' => $partner->name,
            'type' => $partner->type,
            'phone' => $partner->phone,
            'email' => $partner->email,
            'is_active' => $partner->is_active,
            'balance' => $partner->balance, // Calculé dynamiquement
        ]);

        return Inertia::render('Partners/Index', [
            'partners' => $partners,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:customer,supplier,both',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        Partner::create($validated);

        return redirect()->back()->with('success', 'Partenaire ajouté avec succès.');
    }

    public function update(Request $request, Partner $partner)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:customer,supplier,both',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $partner->update($validated);

        return redirect()->back()->with('success', 'Partenaire mis à jour.');
    }

    public function destroy(Partner $partner)
    {
        if ($partner->invoices()->exists()) {
            return redirect()->back()->withErrors(['message' => 'Impossible de supprimer un partenaire lié à des factures.']);
        }
        $partner->delete();
        return redirect()->back()->with('success', 'Partenaire supprimé.');
    }

    /**
     * Génère un relevé PDF des transactions (3 derniers mois)
     */
    public function downloadStatement(Partner $partner)
    {
        $threeMonthsAgo = Carbon::now()->subMonths(3);

        $invoices = $partner->invoices()
            ->with(['payments'])
            ->where('date', '>=', $threeMonthsAgo)
            ->where('status', '!=', 'cancelled')
            ->orderBy('date', 'asc')
            ->get();

        $pdf = Pdf::loadView('pdfs.statement', [
            'partner' => $partner,
            'invoices' => $invoices,
            'period_start' => $threeMonthsAgo->format('d/m/Y'),
            'period_end' => Carbon::now()->format('d/m/Y'),
            'balance' => $partner->balance
        ]);

        return $pdf->download("Releve_Compte_{$partner->name}_" . date('Y_m_d') . ".pdf");
    }
}