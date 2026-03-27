
{/**
import { type Batiment } from '@/types';
import { useForm } from '@inertiajs/react';
import { generationPost } from '@/routes';



interface props {
    batiments: Batiment[];
    hideForm: () => void;
  }
  
export function FormGeneration({ batiments,  hideForm }: props){
  
  
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

*/}
