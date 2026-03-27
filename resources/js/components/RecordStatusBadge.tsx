import React from 'react';
import { DailyRecordStatus } from '@/types';

interface Props {
  status: DailyRecordStatus;
}

const statusConfig: Record<DailyRecordStatus, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
  approved: { color: 'bg-green-100 text-green-700', label: 'Approuvé' },
  rejected: { color: 'bg-red-100 text-red-700', label: 'Rejeté' },
};

export default function RecordStatusBadge({ status }: Props) {
  const config = statusConfig[status];
  return (
    <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>
      {config.label}
    </span>
  );
}