<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Relevé de compte - {{ $partner->name }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 13px; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 22px; font-weight: bold; color: #4f46e5; }
        .info-box { width: 45%; }
        .info-box h3 { margin-top: 0; color: #6b7280; font-size: 12px; text-transform: uppercase; }
        .title { text-align: center; margin-bottom: 30px; }
        .title h2 { margin: 0; font-size: 24px; }
        .title p { margin: 5px 0 0 0; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { padding: 10px; border: 1px solid #e5e7eb; text-align: left; }
        th { background-color: #f9fafb; color: #374151; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-red { color: #dc2626; }
        .text-green { color: #16a34a; }
        .total-row th, .total-row td { background-color: #f3f4f6; font-weight: bold; font-size: 14px; }
    </style>
</head>
<body>

    <div class="header">
        <table style="width: 100%; border: none;">
            <tr style="border: none;">
                <td style="border: none; vertical-align: top; width: 50%;">
                    <div class="logo">FERME AGRICOLE</div>
                    <p style="margin-top: 10px; line-height: 1.5;">
                        123 Route des Éleveurs<br>
                        Tél: +221 77 123 45 67
                    </p>
                </td>
                <td style="border: none; vertical-align: top; text-align: right; width: 50%;">
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; text-align: left; display: inline-block; min-width: 250px;">
                        <h3 style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Compte Partenaire</h3>
                        <strong>{{ $partner->name }}</strong><br>
                        @if($partner->phone) Tél: {{ $partner->phone }}<br> @endif
                        @if($partner->email) Email: {{ $partner->email }}<br> @endif
                        @if($partner->address) {{ $partner->address }} @endif
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="title">
        <h2>RELEVÉ DE COMPTE</h2>
        <p>Période du {{ $period_start }} au {{ $period_end }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Opération</th>
                <th>Référence</th>
                <th class="text-right">Débit (Facturé)</th>
                <th class="text-right">Crédit (Payé)</th>
                <th class="text-right">Solde Cumulé</th>
            </tr>
        </thead>
        <tbody>
            @php
                $runningBalance = 0;
            @endphp
            
            @foreach($invoices as $invoice)
                @php
                    $runningBalance += $invoice->total;
                @endphp
                <tr>
                    <td>{{ $invoice->date->format('d/m/Y') }}</td>
                    <td>Facture N° {{ $invoice->number }}</td>
                    <td>-</td>
                    <td class="text-right text-red">{{ number_format($invoice->total, 0, ',', ' ') }}</td>
                    <td class="text-right">-</td>
                    <td class="text-right">{{ number_format($runningBalance, 0, ',', ' ') }}</td>
                </tr>
                
                @foreach($invoice->payments as $payment)
                    @php
                        $runningBalance -= $payment->amount;
                    @endphp
                    <tr style="background-color: #fdfdfd;">
                        <td style="padding-left: 20px; color: #6b7280;">{{ $payment->payment_date->format('d/m/Y') }}</td>
                        <td style="color: #6b7280;">Règlement ({{ $payment->method }})</td>
                        <td style="font-family: monospace; color: #6b7280;">{{ $payment->reference ?? '-' }}</td>
                        <td class="text-right">-</td>
                        <td class="text-right text-green">{{ number_format($payment->amount, 0, ',', ' ') }}</td>
                        <td class="text-right">{{ number_format($runningBalance, 0, ',', ' ') }}</td>
                    </tr>
                @endforeach
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="5" class="text-right">SOLDE FINAL À PAYER :</td>
                <td class="text-right @if($balance > 0) text-red @else text-green @endif">
                    {{ number_format($balance, 0, ',', ' ') }} FCFA
                </td>
            </tr>
        </tfoot>
    </table>

</body>
</html>