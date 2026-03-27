import React from 'react';
import { FlockStatus } from '@/types';

interface Props {
  status: FlockStatus;
}

const statusConfig: Record<FlockStatus, { color: string; label: string }> = {
  draft: { color: 'bg-gray-100 text-gray-700', label: 'Brouillon' },
  pending: { color: 'bg-yellow-100 text-yellow-700', label: 'En attente' },
  active: { color: 'bg-green-100 text-green-700', label: 'Active' },
  rejected: { color: 'bg-red-100 text-red-700', label: 'Rejetée' },
};

export default function FlockStatusBadge({ status }: Props) {
  const config = statusConfig[status];
  return (
    <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>
      {config.label}
    </span>
  );
}