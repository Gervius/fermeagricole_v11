<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Flock;
use App\Models\Partner;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\InvoiceService;
use App\Services\ApprovalService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class InvoiceController extends Controller
{
    use AuthorizesRequests;

    protected InvoiceService $invoiceService;
    protected ApprovalService $approvalService;

    public function __construct(InvoiceService $invoiceService, ApprovalService $approvalService)
    {
        $this->invoiceService = $invoiceService;
        $this->approvalService = $approvalService;
    }
    /**
     * Liste des factures avec filtres de paiement.
     */
    public function index(Request $request)
    {
        $query = Invoice::with(['creator', 'items', 'partner', 'workflowStep'])
            ->when($request->search, function ($q, $search) {
                $q->where('number', 'like', "%{$search}%")
                ->orWhere('customer_name', 'like', "%{$search}%");
            })
            ->when($request->payment_status, fn($q, $status) => $q->where('payment_status', $status));

        $invoices = $query->latest()->paginate(15)->through(fn($invoice) => [
            'id' => $invoice->id,
            'number' => $invoice->number,
            'customer_name' => $invoice->customer_name,
            'customer_phone' => $invoice->partner?->phone, // si relation partner
            'date' => $invoice->date->format('Y-m-d'),
            'due_date' => $invoice->due_date?->format('Y-m-d'),
            'total' => $invoice->total,
            'paid_amount' => $invoice->payments()->sum('amount'),
            'remaining' => $invoice->total - $invoice->payments()->sum('amount'),
            'status' => $invoice->status,
            'workflow_step' => $invoice->workflowStep?->name,
            'payment_status' => $invoice->payment_status,
            'items_count' => $invoice->items->count(),
            'items_types' => $invoice->items->pluck('itemable_type')->map(fn($type) => 
                str_contains($type, 'Egg') ? 'egg' : (str_contains($type, 'Flock') ? 'flock' : 'other')
            )->unique()->values(),
            'is_overdue' => $invoice->due_date && $invoice->due_date->isPast() && $invoice->payment_status !== 'paid',
        ]);

        return Inertia::render('Invoices/Index', [
            'invoices' => $invoices,
            'filters' => $request->only(['search', 'payment_status']),
            'stats' => [
                'total_revenue' => Invoice::whereNotIn('status', ['draft', 'cancelled'])->sum('total'),
                'total_collected' => \App\Models\Payment::sum('amount'),
                'total_receivable' => Invoice::whereNotIn('status', ['draft', 'cancelled'])->get()->sum(fn($inv) => $inv->total - $inv->payments()->sum('amount')),
                'overdue_count' => Invoice::whereNotIn('status', ['draft', 'cancelled'])
                    ->where('payment_status', '!=', 'paid')
                    ->whereNotNull('due_date')
                    ->where('due_date', '<', now())
                    ->count(),
            ]
        ]);
    }

    /**
     * Création de facture avec support d'importation (Flock ou Egg).
     */
    public function create(Request $request)
    {
        $import = null;
        if ($request->has('source_id')) {
            $import = [
                'itemable_id' => $request->source_id,
                'itemable_type' => $request->source_type === 'flock' ? Flock::class : 'Egg',
                'description' => $request->description,
                'quantity' => (float) $request->quantity,
                'unit_price' => 0,
            ];
        }

        return Inertia::render('Invoices/Create', [
            'import' => $import,
            'activeFlocks' => Flock::active()->get(['id', 'name']),
            // CRUCIAL : On récupère le type pour le filtrage React
            'customers' => Partner::where('is_active', true)
                ->get(['id', 'name', 'type']), 
            'nextInvoiceNumber' => 'FAC-' . date('Ymd') . '-' . str_pad(Invoice::count() + 1, 4, '0', STR_PAD_LEFT)
        ]);
    }

    /**
     * Enregistrement atomique (Transaction) de la facture et de ses lignes.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:sale,purchase',
            'partner_id' => 'required|exists:partners,id',
            'date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated) {
            $subtotal = collect($validated['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);
            $partner = Partner::findOrFail($validated['partner_id']);

            $invoice = $this->invoiceService->createDraft([
                'type' => $validated['type'],
                'partner_id' => $validated['partner_id'],
                'customer_name' => $partner->name,
                'date' => $validated['date'],
                'subtotal' => $subtotal,
                'total' => $subtotal,
                'payment_status' => 'unpaid',
            ], auth()->id());

            foreach ($validated['items'] as $item) {
                $invoice->items()->create($item);
            }
        });

        return redirect()->route('invoicesIndex')->with('success', 'Facture brouillon créée avec succès.');
    }

    public function submit(Invoice $invoice)
    {
        $this->authorize('submit', $invoice);

        DB::transaction(function () use ($invoice) {
            $this->approvalService->submit($invoice);
        });

        return back()->with('success', 'Facture soumise pour approbation.');
    }

    public function approve(Invoice $invoice)
    {
        $this->authorize('approve', $invoice);

        DB::transaction(function () use ($invoice) {
            $isLastStep = !\App\Models\WorkflowStep::where('is_active', true)
                ->where('order', '>', $invoice->workflowStep->order)
                ->exists();

            if ($isLastStep) {
                foreach ($invoice->items as $item) {
                    if ($item->itemable_type === Flock::class) {
                        $flock = Flock::find($item->itemable_id);
                        if (!$flock || !$flock->canSell($item->quantity)) {
                            throw new \Exception("Stock insuffisant pour le lot {$flock->name}. Disponible : {$flock->calculated_quantity}, demandé : {$item->quantity}");
                        }
                    }
                }
            }

            $this->approvalService->approve($invoice, auth()->id());

            $invoice->refresh();
            if ($invoice->status === 'approved') {
                $this->invoiceService->issueInvoice($invoice);
            }
        });

        return back()->with('success', 'Facture approuvée.');
    }

    public function reject(Request $request, Invoice $invoice)
    {
        $this->authorize('approve', $invoice);

        $request->validate(['comments' => 'required|string|min:5']);

        DB::transaction(function () use ($invoice, $request) {
            $this->approvalService->reject($invoice, auth()->id(), $request->comments);
        });

        return back()->with('warning', 'Facture rejetée et retournée au brouillon.');
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['items', 'payments', 'creator', 'approver', 'partner', 'workflowStep', 'approvals.user', 'auditLogs.user']);
        $partner = $invoice->partner;
        $statement = $partner ? $partner->getStatement() : [];

        return Inertia::render('Invoices/Show', [
            'invoice' => array_merge($invoice->toArray(), [
                'can_submit' => auth()->user()->can('submit', $invoice),
                'can_approve' => auth()->user()->can('approve', $invoice),
                'can_cancel' => auth()->user()->can('cancel', $invoice),
                'can_add_payment' => $invoice->can_add_payment,
            ]),
            'remaining_amount' => $invoice->total - $invoice->payments()->sum('amount'),
            'partner' => $partner ? [
                'id' => $partner->id,
                'name' => $partner->name,
                'phone' => $partner->phone,
                'email' => $partner->email,
                'balance' => $partner->balance,
                'statement' => $statement,
            ] : null,
        ]);
    }

    /**
     * Enregistrer un paiement (complet ou partiel).
     */
    public function addPayment(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1|max:' . ($invoice->total - $invoice->payments()->sum('amount')),
            'payment_date' => 'required|date',
            'method' => 'required|string',
            'reference' => 'nullable|string',
        ]);

        DB::transaction(function () use ($invoice, $validated) {
            $payment = $invoice->payments()->create([
                'amount' => $validated['amount'],
                'payment_date' => $validated['payment_date'],
                'method' => $validated['method'],
                'reference' => $validated['reference'],
                'created_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Paiement enregistré avec succès.');
    }


    /**
     * Annuler une facture (avec gestion des stocks et compta).
     */
    public function cancel(Request $request, Invoice $invoice)
    {
        $this->authorize('cancel', $invoice);

        $request->validate(['reason' => 'required|string|min:10']);

        DB::transaction(function () use ($invoice, $request) {
            $invoice->notes = $invoice->notes . "\n[ANNULATION] Motif : " . $request->reason;
            $this->invoiceService->cancelInvoice($invoice);
        });

        return redirect()->route('invoicesIndex')->with('warning', 'Facture annulée.');
    }

    /**
     * Export PDF de la facture.
     */
    public function downloadPdf(Invoice $invoice)
    {
        $invoice->load(['items', 'payments']);
        
        $pdf = Pdf::loadView('pdfs.invoice', compact('invoice'));
        
        return $pdf->download("Facture_{$invoice->number}.pdf");
    }

    
    /* public function whatsapp(Invoice $invoice)
    {
        $phone = $invoice->partner?->phone; // ou customer_phone si vous avez un champ
        if (!$phone) {
            return back()->with('error', 'Numéro de téléphone manquant.');
        }
        $message = "Bonjour {$invoice->customer_name}, votre facture {$invoice->number} d'un montant de " . formatCurrency($invoice->remaining) . " est due.";
        $url = "https://wa.me/" . preg_replace('/\s+/', '', $phone) . "?text=" . urlencode($message);
        return redirect()->away($url);
    } */
    
}