<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Facture {{ $invoice->number }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 14px; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
        .company-details { text-align: right; font-size: 12px; color: #6b7280; }
        .invoice-details { margin-bottom: 30px; display: flex; justify-content: space-between; }
        .client-info h3 { margin-top: 0; color: #111827; }
        .meta-info table { width: auto; }
        .meta-info th { text-align: left; padding-right: 15px; color: #6b7280; font-weight: normal; }
        .meta-info td { font-weight: bold; }
        table.items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        table.items th { background-color: #f9fafb; border-bottom: 2px solid #e5e7eb; padding: 12px; text-align: left; color: #374151; }
        table.items td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
        .text-right { text-align: right !important; }
        .totals { width: 40%; margin-left: auto; border-collapse: collapse; }
        .totals th, .totals td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
        .totals .grand-total { font-weight: bold; font-size: 18px; color: #111827; border-top: 2px solid #111827; }
        .payments { margin-top: 40px; font-size: 12px; }
        .payments table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .payments th, .payments td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .paid { background-color: #d1fae5; color: #065f46; }
        .partial { background-color: #fef3c7; color: #92400e; }
        .unpaid { background-color: #f3f4f6; color: #4b5563; }
    </style>
</head>
<body>

    <div class="header">
        <div class="logo">FERME AGRICOLE</div>
        <div class="company-details">
            123 Route des Éleveurs<br>
            Zone Rurale, Dakar, Sénégal<br>
            Tél: +221 77 123 45 67<br>
            Email: contact@ferme-agricole.com
        </div>
    </div>

    <div class="invoice-details">
        <div class="client-info">
            <h3 style="color: #6b7280; font-size: 14px; text-transform: uppercase;">Facturé à :</h3>
            <p style="font-size: 16px; font-weight: bold; margin: 5px 0;">{{ $invoice->customer_name }}</p>
        </div>
        
        <div class="meta-info">
            <h2 style="margin: 0 0 10px 0; font-size: 28px; color: #111827;">FACTURE</h2>
            <table>
                <tr><th>Numéro:</th><td>{{ $invoice->number }}</td></tr>
                <tr><th>Date:</th><td>{{ $invoice->date->format('d/m/Y') }}</td></tr>
                @if($invoice->due_date)
                    <tr><th>Échéance:</th><td>{{ $invoice->due_date->format('d/m/Y') }}</td></tr>
                @endif
                <tr>
                    <th>Statut:</th>
                    <td>
                        <span class="status-badge {{ $invoice->payment_status === 'paid' ? 'paid' : ($invoice->payment_status === 'partial' ? 'partial' : 'unpaid') }}">
                            @if($invoice->payment_status === 'paid') SOLDÉE
                            @elseif($invoice->payment_status === 'partial') PARTIELLE
                            @else NON PAYÉE @endif
                        </span>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>Description</th>
                <th class="text-right">Qté</th>
                <th class="text-right">Prix Unitaire (FCFA)</th>
                <th class="text-right">Total (FCFA)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $item)
            <tr>
                <td>{{ $item->description }}</td>
                <td class="text-right">{{ number_format($item->quantity, 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($item->unit_price, 0, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($item->total, 0, ',', ' ') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr>
            <th class="text-right">Total HT</th>
            <td class="text-right">{{ number_format($invoice->subtotal, 0, ',', ' ') }}</td>
        </tr>
        @if($invoice->tax_amount > 0)
        <tr>
            <th class="text-right">TVA ({{ $invoice->tax_rate }}%)</th>
            <td class="text-right">{{ number_format($invoice->tax_amount, 0, ',', ' ') }}</td>
        </tr>
        @endif
        <tr class="grand-total">
            <th class="text-right">Total TTC</th>
            <td class="text-right">{{ number_format($invoice->total, 0, ',', ' ') }} FCFA</td>
        </tr>
    </table>

    @if($invoice->payments->count() > 0)
    <div class="payments">
        <h3 style="margin-bottom: 5px; color: #4b5563;">Historique des Paiements / Mobile Money</h3>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Méthode</th>
                    <th>Référence (Txn)</th>
                    <th class="text-right">Montant (FCFA)</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice->payments as $payment)
                <tr>
                    <td>{{ $payment->payment_date->format('d/m/Y') }}</td>
                    <td>{{ $payment->method }}</td>
                    <td style="font-family: monospace;">{{ $payment->reference ?? '-' }}</td>
                    <td class="text-right">{{ number_format($payment->amount, 0, ',', ' ') }}</td>
                </tr>
                @endforeach
            </tbody>
            <tfoot>
                <tr>
                    <th colspan="3" class="text-right">Reste à Payer :</th>
                    <th class="text-right" style="color: #b91c1c;">{{ number_format($invoice->remaining_amount, 0, ',', ' ') }}</th>
                </tr>
            </tfoot>
        </table>
    </div>
    @endif

    <div class="footer">
        <p>Merci pour votre confiance. Les paiements par Mobile Money doivent préciser le numéro de facture en référence.</p>
        <p>Généré le {{ now()->format('d/m/Y à H:i') }}</p>
    </div>

</body>
</html>