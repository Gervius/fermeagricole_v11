<?php

namespace App\Exports;

use App\Models\StockMouvement;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class StockMovementsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    public function collection()
    {
        return StockMouvement::with(['ingredient', 'unit', 'creator', 'approver'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Date',
            'Ingrédient',
            'Type',
            'Quantité',
            'Unité',
            'Prix Unitaire (PMP)',
            'Raison',
            'Statut',
            'Créé par',
            'Approuvé par',
        ];
    }

    public function map($movement): array
    {
        return [
            $movement->created_at->format('d/m/Y H:i'),
            $movement->ingredient->name ?? '-',
            $movement->type === 'in' ? 'Entrée' : ($movement->type === 'out' ? 'Sortie' : 'Ajustement'),
            $movement->quantity,
            $movement->unit->symbol ?? '-',
            $movement->unit_price,
            $movement->reason,
            $movement->status,
            $movement->creator->name ?? '-',
            $movement->approver->name ?? '-',
        ];
    }
}