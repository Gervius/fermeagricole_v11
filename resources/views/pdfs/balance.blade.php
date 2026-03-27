<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Balance Générale</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; font-size: 12px; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 20px; font-weight: bold; color: #4f46e5; margin-bottom: 5px; }
        h1 { font-size: 18px; margin: 0 0 5px 0; color: #111827; }
        .date { color: #6b7280; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 8px 10px; border: 1px solid #e5e7eb; text-align: left; }
        th { background-color: #f9fafb; font-weight: bold; color: #374151; font-size: 11px; text-transform: uppercase; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .bg-gray { background-color: #f3f4f6; }
        .text-blue { color: #1d4ed8; }
        .totals th, .totals td { font-weight: bold; background-color: #f9fafb; font-size: 13px; }
    </style>
</head>
<body>

    <div class="header">
        <div class="logo">FERME AGRICOLE</div>
        <h1>Balance Générale</h1>
        <div class="date">Édité le : {{ date('d/m/Y') }}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th rowspan="2" style="width: 15%;">N° Compte</th>
                <th rowspan="2" style="width: 35%;">Intitulé du compte</th>
                <th colspan="2" style="text-align: center;">Mouvements</th>
                <th colspan="2" style="text-align: center;">Soldes</th>
            </tr>
            <tr>
                <th class="text-right">Débit</th>
                <th class="text-right">Crédit</th>
                <th class="text-right">Débiteur</th>
                <th class="text-right">Créditeur</th>
            </tr>
        </thead>
        <tbody>
            @foreach($accounts as $account)
                @if($account->debit > 0 || $account->credit > 0)
                <tr>
                    <td class="font-bold">{{ $account->code }}</td>
                    <td>{{ $account->name }}</td>
                    <td class="text-right">{{ number_format($account->debit, 2, ',', ' ') }}</td>
                    <td class="text-right">{{ number_format($account->credit, 2, ',', ' ') }}</td>
                    <td class="text-right text-blue">{{ $account->solde_debiteur > 0 ? number_format($account->solde_debiteur, 2, ',', ' ') : '-' }}</td>
                    <td class="text-right text-blue">{{ $account->solde_crediteur > 0 ? number_format($account->solde_crediteur, 2, ',', ' ') : '-' }}</td>
                </tr>
                @endif
            @endforeach
        </tbody>
        <tfoot>
            <tr class="totals">
                <td colspan="2" class="text-right text-blue font-bold">TOTAL GÉNÉRAL</td>
                <td class="text-right">{{ number_format($totalDebit, 2, ',', ' ') }}</td>
                <td class="text-right">{{ number_format($totalCredit, 2, ',', ' ') }}</td>
                <td class="text-right"></td>
                <td class="text-right"></td>
            </tr>
        </tfoot>
    </table>

</body>
</html>