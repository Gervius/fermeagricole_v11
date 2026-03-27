<?php

namespace App\Exports;

use App\Models\JournalVoucher;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class JournalVouchersExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    public function collection()
    {
        // On récupère directement les lignes (Entries) avec leurs Vouchers associés
        return \App\Models\JournalEntry::with(['voucher.creator', 'account'])
            ->whereHas('voucher', function ($q) {
                $q->where('status', 'posted');
            })
            ->orderBy('id', 'asc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Date',
            'N° Pièce',
            'N° Compte',
            'Intitulé Compte',
            'Libellé Écriture',
            'Débit',
            'Crédit',
            'Créé par',
        ];
    }

    public function map($entry): array
    {
        return [
            $entry->voucher->date->format('d/m/Y'),
            $entry->voucher->voucher_number,
            $entry->account->code ?? '-',
            $entry->account->name ?? '-',
            $entry->description ?? $entry->voucher->description,
            $entry->debit > 0 ? $entry->debit : '',
            $entry->credit > 0 ? $entry->credit : '',
            $entry->voucher->creator->name ?? '-',
        ];
    }
}