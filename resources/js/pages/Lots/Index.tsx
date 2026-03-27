{/**
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { generation, generationPost } from '@/routes';
import { type Batiment, type BreadcrumbItem, type Generation } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, TrendingUp, TrendingDown, MapPin, ClipboardList } from 'lucide-react';
import { FormGeneration } from './Create';


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Generation',
        href: generation.url(),
    },
    
];





interface prop {
    lots: Generation[];
    batiments: Batiment[];
}

 

export default function Index({ lots, batiments }: prop) {

    const [showForm, setShowForm] = useState(false);
    const [showDailyTracking, setShowDailyTracking] = useState(false);
  
    const [showDailyForm, setShowDailyForm] = useState(false);
  
  
    

    const [dailyFormData, setDailyFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        losses: '',
        eggs: '',
        notes: '',
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'reforming':
        return 'bg-orange-100 text-orange-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'reforming':
        return 'En réforme';
      case 'completed':
        return 'Terminée';
      default:
        return status;
    }
  };

  

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Generation" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-gray-900 mb-2">Gestion des générations</h1>
                            <p className="text-gray-600">Suivez vos différentes générations de poules pondeuses</p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                            <Plus className="w-5 h-5" />
                            Nouvelle génération
                        </button>
                    </div>

                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-sm text-gray-600 mb-2">Total poules actives</div>
                            <div className="text-2xl text-gray-900">12,280</div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-sm text-gray-600 mb-2">Taux de ponte moyen</div>
                            <div className="text-2xl text-gray-900">87.5%</div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-sm text-gray-600 mb-2">Générations actives</div>
                            <div className="text-2xl text-gray-900">3</div>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <div className="text-sm text-gray-600 mb-2">Mortalité moyenne</div>
                            <div className="text-2xl text-gray-900">3.1%</div>
                        </div>
                    </div>

                   
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm text-gray-600">Génération</th>
                                        <th className="px-6 py-3 text-left text-sm text-gray-600">Bâtiment</th>
                                        <th className="px-6 py-3 text-left text-sm text-gray-600">Date arrivée</th>
                                        <th className="px-6 py-3 text-left text-sm text-gray-600">Âge (sem.)</th>
                                        <th className="px-6 py-3 text-left text-sm text-gray-600">Effectif</th>
                                        <th className="px-6 py-3 text-left text-sm text-gray-600">Taux Ponte</th>
                                        <th className="px-6 py-3 text-left text-sm text-gray-600">Statut</th>
                                        <th className="px-6 py-3 text-left text-sm text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {lots.map((flock) => (
                                        <tr key={flock.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-gray-900">{flock.code_lot}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                
                                                {flock.batiment ? flock.batiment.nom : 'Sans bâtiment'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    {new Date(flock.date_entree).toLocaleDateString('fr-FR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">2</td>
                                            <td className="px-6 py-4">
                                                <div className="text-gray-900">{flock.effectif_actuel.toLocaleString()}</div>
                                                <div className="text-sm text-gray-500">sur {flock.effectif_initial.toLocaleString()}</div>
                                            </td>
                                            
                                            <td className="px-6 py-4">
                                                <PerformancePonte tauxPonte={0} />
                                            </td>
                                            
                                            <td className="px-6 py-4">
                                              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(flock.statut)}`}>
                                                {getStatusLabel(flock.statut)}
                                              </span>
                                            </td>
                                            <td className="px-6 py-4">
                                              <div className="flex items-center gap-2">
                                                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                  <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                  
                                                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                                >
                                                  <ClipboardList className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                   
                    {showForm && ( <FormGeneration  hideForm={() => setShowForm(false)} batiments={batiments}></FormGeneration>
                    )}
                    
                </div>
            </div>
        </AppLayout>
    );
}

function PerformancePonte({tauxPonte}: {tauxPonte: number}){
  let indicateur;
  if (tauxPonte >= 85) {
    indicateur = <TrendingUp className='w-4 h-4 text-green-600'/>
  }
  else{
    indicateur = <TrendingDown className='w-4 h-4 text-orange-600'/>
  }

  return (
    <div className="flex items-center gap-2">
      {indicateur}
      <span className="text-gray-900">{tauxPonte}%</span>
    </div>
  );
}

*/}

{/*


interface props {
  batiments: Batiment[];
  hideForm: () => void;
}

function FormGeneration({ batiments,  hideForm }: props){


  const { data, setData, post, processing, errors } = useForm({
    code_lot: '',
    date_entree: '',
    effectif_initial: '',
    batiment_id: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(generationPost.url(), {
      onSuccess: () => {
        hideForm(); 
        setData({
          code_lot: '',
          date_entree: '',
          effectif_initial: '',
          batiment_id: '',
        });
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-gray-900 mb-6">Nouvelle génération</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm text-gray-700 mb-2">Nom de la génération</label>
                    <input
                        type="text"
                        value={data.code_lot}
                        onChange={(e) => setData({ ...data, code_lot: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Ex: G-2023-12"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-700 mb-2">Date d'arrivée</label>
                    <input
                        type="date"
                        value={data.date_entree}
                        onChange={(e) => setData({ ...data, date_entree: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-700 mb-2">Nombre initial</label>
                    <input
                        type="number"
                        value={data.effectif_initial}
                        onChange={(e) => setData({ ...data, effectif_initial: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Ex: 5000"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-700 mb-2">Bâtiment</label>
                    <select 
                        value={data.batiment_id}
                        onChange={(e) => setData({ ...data, batiment_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        required
                    >
                        <option value="">Sélectionner un bâtiment</option>
                        {batiments.map((batiment)=> (
                            <option key={batiment.id} value={batiment.id}>{batiment.nom}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={hideForm}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        Créer
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
}
**/}