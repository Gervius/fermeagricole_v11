import React from 'react';
import { Link, router } from '@inertiajs/react';
import { flocksEdit, flocksDestroy, flocksSubmit, flocksShow } from '@/routes';
import { Calendar, MapPin, Send, AlertCircle, ClipboardList, Edit2, Trash2 } from 'lucide-react';

interface Flock {
  id: number;
  name: string;
  building: string;
  arrival_date: string;
  initial_quantity: number;
  current_quantity: number;
  status: string;
  creator: string;
  can_edit: boolean;
  can_delete: boolean;
  can_submit: boolean;
  can_approve: boolean;
  can_reject: boolean;
}

interface Props {
  flocks: Flock[];
  onApproveClick: (flock: Flock) => void;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  active: 'Active',
  rejected: 'Rejetée',
};

export default function FlockTable({ flocks, onApproveClick }: Props) {
  const handleSubmit = (id: number) => {
    router.post(flocksSubmit.url(id));
  };

  const handleDelete = (id: number) => {
    if (confirm('Supprimer ce lot ?')) {
      router.delete(flocksDestroy.url(id));
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm text-gray-600">Génération</th>
              <th className="px-6 py-3 text-left text-sm text-gray-600">Bâtiment</th>
              <th className="px-6 py-3 text-left text-sm text-gray-600">Date arrivée</th>
              <th className="px-6 py-3 text-left text-sm text-gray-600">Effectif</th>
              <th className="px-6 py-3 text-left text-sm text-gray-600">Statut</th>
              <th className="px-6 py-3 text-left text-sm text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {flocks.map((flock) => (
              <tr key={flock.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <Link href={flocksShow.url({flock:flock.id})} className="text-gray-900 hover:text-amber-600">
                    {flock.name}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {flock.building}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(flock.arrival_date).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-900">{flock.current_quantity.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">sur {flock.initial_quantity.toLocaleString()}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${statusColors[flock.status]}`}>
                    {statusLabels[flock.status]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {flock.can_submit && (
                      <button
                        onClick={() => handleSubmit(flock.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Soumettre pour approbation"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {flock.can_approve && (
                      <button
                        onClick={() => onApproveClick(flock)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Approuver/Rejeter"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </button>
                    )}
                    {flock.status === 'active' && (
                      <Link
                        href={flocksShow.url({flock:flock.id})}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Voir le détail"
                      >
                        <ClipboardList className="w-4 h-4" />
                      </Link>
                    )}
                    {flock.can_edit && (
                      <Link
                        href={flocksEdit.url(flock.id)}
                        className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    )}
                    {flock.can_delete && (
                      <button
                        onClick={() => handleDelete(flock.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}