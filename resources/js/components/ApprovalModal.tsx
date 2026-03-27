import React, { useState } from 'react';
import { XCircle, CheckCircle } from 'lucide-react';

interface Flock {
  id: number;
  name: string;
  building: string;
  initial_quantity: number;
  creator: string;
}

interface Props {
  flock: Flock | null;
  onClose: () => void;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
}

export default function FlockApprovalModal({ flock, onClose, onApprove, onReject }: Props) {
  const [rejectionReason, setRejectionReason] = useState('');

  if (!flock) return null;

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(flock.id, rejectionReason);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Approbation de génération</h2>
        <div className="space-y-4 mb-6">
          <div>
            <span className="text-sm text-gray-600">Génération:</span>
            <span className="ml-2 text-gray-900 font-medium">{flock.name}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Bâtiment:</span>
            <span className="ml-2 text-gray-900">{flock.building}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Effectif initial:</span>
            <span className="ml-2 text-gray-900">{flock.initial_quantity.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-sm text-gray-600">Créée par:</span>
            <span className="ml-2 text-gray-900">{flock.creator}</span>
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Raison du rejet (si rejeté)
          </label>
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            rows={3}
            placeholder="Entrez la raison du rejet..."
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleReject}
            disabled={!rejectionReason.trim()}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Rejeter
          </button>
          <button
            onClick={() => onApprove(flock.id)}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Approuver
          </button>
        </div>
      </div>
    </div>
  );
}