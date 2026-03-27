# Architecture Technique : Intégration DailyRecord avec Laravel 12 et Inertia React

## Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Architecture générale](#architecture-générale)
3. [Étapes de la connexion](#étapes-de-la-connexion)
4. [Détail des couches](#détail-des-couches)
5. [Bonnes pratiques appliquées](#bonnes-pratiques-appliquées)
6. [Flux de données complet](#flux-de-données-complet)

---

## Vue d'ensemble

Ce document explique comment le système de suivi quotidien des troupeaux (DailyRecords) s'intègre dans l'application fermeagricole_v3. L'approche utilisée établit une **séparation claire des responsabilités** entre le backend Laravel et le frontend React, tout en maintenant la compatibilité avec le framework Inertia.

**Architecture visuelle :**

```
┌─────────────────────────────────────────────────────────────┐
│                    Flocks/Index (Page Inertia)              │
│  - Affiche le contrôle des troupeaux                        │
│  - Intègre <DailyRecords /> via un modal                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │   DailyRecords Component   │
        │   (React avec TypeScript)  │
        │  - État local (React)      │
        │  - Fetch XHR               │
        │  - Validation côté client  │
        │  - Toast & Loading UX      │
        └────────────────┬───────────┘
                         │
        ┌────────────────┴────────────────┐
        │    JSON Endpoints (STATELESS)   │
        │    - DailyRecordController      │
        ▼                                 ▼
    ┌─────────────────────┐    ┌──────────────────────┐
    │ GET /flocks/{id}/   │    │ POST /daily-records  │
    │ daily-records       │    │ -> Store             │
    │ -> Index (JSON)     │    │ POST /daily-records/ │
    └─────────────────────┘    │ {id}/approve         │
                               │ POST /daily-records/ │
                               │ {id}/reject          │
                               └──────────────────────┘
                                       │
                                       ▼
                        ┌──────────────────────────────┐
                        │ Base de données              │
                        │ - DailyRecord (table)        │
                        │ - Flock (reference)          │
                        │ - User (creator/approver)    │
                        └──────────────────────────────┘
```

---

## Architecture générale

### Principes fondamentaux

1. **Inertia comme cadre principal** : Les pages sont rendues via Inertia (Server-Side Rendering avec hydratation React).
2. **Endpoints JSON secondaires** : Supplémentaires pour XHR (fetch), sans remplacer Inertia.
3. **Composant embeddé** : DailyRecords fonctionne comme un composant autonome avec son propre état.
4. **Sécurité CSRF** : Protection via tokens XSRF-TOKEN cookie + headers.
5. **Validation en deux niveaux** : Côté client (UX), côté serveur (sécurité).

---

## Étapes de la connexion

### 1. **Initialisation (Flocks/Index.tsx)**

Quand l'utilisateur ouvre la page des troupeaux :

```typescript
// resources/js/pages/Flocks/Index.tsx
export default function Index({ flocks, selectedFlockId }: PageProps) {
    const [selectedFlock, setSelectedFlock] = useState<Flock | null>(null);
    
    return (
        <>
            {/* ... liste des troupeaux ... */}
            
            {/* Modal de suivi */}
            {showTracking && selectedFlock && (
                <Modal onClose={() => setShowTracking(false)}>
                    <DailyRecords initialFlock={selectedFlock} />
                </Modal>
            )}
        </>
    );
}
```

**Pourquoi cette approche ?**
- Le composant `DailyRecords` peut être réutilisé dans plusieurs pages.
- L'état du troupeau (`selectedFlock`) est passé en prop, découplant la logique.
- Pas de rechargement full-page ; la modal reste fluide.

---

### 2. **Chargement des données (DailyRecords.tsx)**

Dès que le composant monte ou que `flock` change :

```typescript
// resources/js/pages/Flocks/Partials/DailyRecords.tsx
useEffect(() => {
    if (!serverRecords && flock) {
        fetchRecords(currentPage);
    }
}, [flock]);

async function fetchRecords(pageNum = 1) {
    setLoadingRecords(true);
    try {
        const res = await fetch(`/flocks/${flock.id}/daily-records?page=${pageNum}`, {
            headers: buildHeaders(),  // Inclut CSRF token
            credentials: 'same-origin',
        });
        
        const json = await res.json();
        if (res.ok) {
            setRecords(json.records);
        } else {
            setError(`Erreur: ${res.status}`);
        }
    } finally {
        setLoadingRecords(false);
    }
}
```

**Pourquoi cette approche ?**
- `credentials: 'same-origin'` : Envoie les cookies de session (authentification).
- Endpoint JSON séparé : Le contrôleur détecte `Accept: application/json` et retourne JSON au lieu d'Inertia.
- Gestion d'état React : Les données restent dans l'état local du composant, pas sur le serveur.

---

### 3. **Contrôleur Laravel agnostique**

```php
// app/Http/Controllers/DailyRecordController.php
public function index(Flock $flock)
{
    // Vérifier les permissions
    $this->authorize('view', $flock);
    
    // Charger les records avec relations
    $records = $flock->dailyRecords()
        ->with(['creator', 'approver'])  // Eager loading
        ->orderBy('date', 'desc')
        ->paginate(20);
    
    // Vérification Accept header
    if (request()->wantsJson()) {
        return response()->json(['records' => $records]);
    }
    
    // Fallback Inertia (pour accès direct à la route)
    return Inertia::render('Flocks/Partials/DailyRecords', [
        'records' => $records,
        'flock' => $flock,
    ]);
}
```

**Avantages :**
- **Un seul contrôleur, deux usages** : Inertia SSR OU JSON XHR.
- **Eager loading** (`with(['creator', 'approver'])`): Évite N+1 queries.
- **Pagination intégrée** : Gérée nativement par Laravel.
- **Autorisation automatique** : `authorize()` vérifie les permissions avant de servir les données.

---

### 4. **Modèle avec relations typées**

```php
// app/Models/DailyRecord.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyRecord extends Model
{
    protected $fillable = ['flock_id', 'date', 'losses', 'eggs', 'notes', 'status', 'created_by', 'approved_by', 'approved_at', 'rejection_reason'];

    protected function casts(): array
    {
        return [
            'date' => 'date',           // Converti automatiquement en Carbon
            'approved_at' => 'datetime',
        ];
    }

    // Relations typées (important pour PHP 8+)
    public function flock(): BelongsTo
    {
        return $this->belongsTo(Flock::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
```

**Pourquoi les type hints sur les relations ?**
- **Sécurité des types** : IDE autocomplete + détection d'erreurs à la compilation.
- **Casting automatique** : Les dates sont converties en objets `Carbon` (manipulation facile).
- **Sérialisation JSON** : Lors de la réponse, les relations sont incluses et formatées correctement.

---

### 5. **Création de record**

Quand l'utilisateur soumet le formulaire :

```typescript
// Frontend (DailyRecords.tsx)
const handleDailySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const res = await fetch('/daily-records', {
        method: 'POST',
        headers: buildHeaders('application/json'),  // CSRF + Content-Type
        credentials: 'same-origin',
        body: JSON.stringify(dailyForm),
    });
    
    if (res.status === 201) {
        // Succès
        await fetchRecords(currentPage);  // Rafraîchit la liste
        showToast('Suivi créé', 'success');
    } else if (res.status === 422) {
        // Erreurs de validation
        const json = await res.json();
        setValidationErrors(json.errors);
    }
};
```

**Backend (DailyRecordController) :**

```php
public function store(StoreDailyRecordRequest $request)
{
    // $request->validate() est appelé automatiquement
    
    $record = DailyRecord::create([
        'flock_id' => $request->validated('flock_id'),
        'date' => $request->validated('date'),
        'losses' => $request->validated('losses'),
        'eggs' => $request->validated('eggs'),
        'notes' => $request->validated('notes') ?? '',
        'status' => 'pending',
        'created_by' => Auth::id(),
    ]);
    
    if (request()->wantsJson()) {
        return response()->json(['message' => 'Record créé'], 201);
    }
    
    return redirect()->back()->with('success', 'Record créé');
}
```

**Flux :**
1. Le formulaire collecte les données côté client.
2. `fetch` envoie JSON + CSRF token.
3. Laravel valide via `StoreDailyRecordRequest`.
4. Si erreurs (422), le frontend les affiche.
5. Si succès (201), le frontend rafraîchit la liste.

---

### 6. **Approbation / Rejet**

Même pattern pour les actions critiques :

```typescript
// Frontend
const handleApprove = async (recordId: number) => {
    const res = await fetch(`/daily-records/${recordId}/approve`, {
        method: 'POST',
        headers: buildHeaders(),
        credentials: 'same-origin',
    });
    
    if (res.ok) {
        await fetchRecords(currentPage);  // Rafraîchir
        showToast('Suivi approuvé', 'success');
    }
};
```

```php
// Backend
public function approve(ApproveDailyRecordRequest $request, DailyRecord $dailyRecord)
{
    // Route model binding : Laravel charge le record et autorise automatiquement
    $this->authorize('approve', $dailyRecord);
    
    $dailyRecord->update([
        'status' => 'approved',
        'approved_by' => Auth::id(),
        'approved_at' => now(),
    ]);
    
    // Mettre à jour le troupeau (ex: quantité actuelle)
    $dailyRecord->flock()->update([
        'current_quantity' => $dailyRecord->flock->current_quantity - $dailyRecord->losses,
    ]);
    
    if (request()->wantsJson()) {
        return response()->json(['message' => 'Approuvé']);
    }
    
    return redirect()->back()->with('success', 'Approuvé');
}
```

---

## Détail des couches

### Couche 1 : Modèle (DailyRecord.php)

| Responsabilité | Exemple |
|---|---|
| **Schéma de données** | Fillable, casts |
| **Relations** | `flock()`, `creator()`, `approver()` |
| **Scopes** | `scopePending()`, `scopeApproved()` |
| **Logique métier** | `isPending()`, `canBeApproved()` |

```php
public function scopePending($query)
{
    return $query->where('status', 'pending');
}

// Usage : DailyRecord::pending()->paginate(20);
```

**Pourquoi ?** : La logique métier reste centralisée et testable.

---

### Couche 2 : Contrôleur (DailyRecordController.php)

| Responsabilité | Exemple |
|---|---|
| **Récupération des données** | Eager loading (`with()`) |
| **Autorisation** | `$this->authorize()` |
| **Validation** | FormRequest classes |
| **Réponse flexible** | JSON ou Inertia |

```php
public function index(Flock $flock)
{
    $this->authorize('view', $flock);  // ← Sécurité
    
    $records = $flock->dailyRecords()
        ->with(['creator', 'approver'])  // ← Performance
        ->orderBy('date', 'desc')
        ->paginate(20);  // ← Pagination
    
    // ← Flexibilité : détecte le type de requête
    if (request()->wantsJson()) {
        return response()->json(['records' => $records]);
    }
    
    return Inertia::render('Flocks/Partials/DailyRecords', compact('records', 'flock'));
}
```

**Content Negotiation** :
```
GET /flocks/1/daily-records
→ Accepte text/html : Inertia
→ Accepte application/json : JSON
```

---

### Couche 3 : Composant React (DailyRecords.tsx)

| Responsabilité | Exemple |
|---|---|
| **État local** | `useState` pour records, form, errors |
| **Récupération asynchrone** | `fetchRecords()` |
| **Gestion des formulaires** | `handleDailySubmit()`, validation côté client |
| **UX** | Loading spinners, toasts, erreurs |
| **Paging** | `goToPage()` |

```typescript
function DailyRecords({ initialFlock, initialRecords }) {
    const [records, setRecords] = useState(initialRecords ?? []);
    const [error, setError] = useState<string | null>(null);
    const [loadingRecords, setLoadingRecords] = useState(false);
    
    async function fetchRecords(pageNum = 1) {
        setLoadingRecords(true);
        try {
            const res = await fetch(`/flocks/${flock.id}/daily-records?page=${pageNum}`, {
                headers: buildHeaders(),
                credentials: 'same-origin',
            });
            
            if (!res.ok) throw new Error(`${res.status}`);
            const json = await res.json();
            setRecords(json.records);
        } catch (e) {
            setError(String(e));
        } finally {
            setLoadingRecords(false);
        }
    }
    
    // Rendu avec tableau pagé, formulaire, états
}
```

---

### Couche 4 : Routes (routes/web.php)

```php
Route::middleware(['auth'])->group(function () {
    // Inertia routes
    Route::get('/flocks', [FlockController::class, 'index'])->name('flocks.index');
    
    // JSON endpoints (REST-like)
    Route::get('/flocks/{flock}/daily-records', [DailyRecordController::class, 'index']);
    Route::post('/daily-records', [DailyRecordController::class, 'store']);
    Route::post('/daily-records/{dailyRecord}/approve', [DailyRecordController::class, 'approve']);
    Route::post('/daily-records/{dailyRecord}/reject', [DailyRecordController::class, 'reject']);
});
```

**Pas de route Inertia pour les records** : Ils sont chargés par XHR une fois la page Flocks ouverte.

---

## Bonnes pratiques appliquées

### 1. **Séparation des responsabilités (SoC)**

```
Modèle          → Données + logique métier
↓
Contrôleur      → Validation, autorisation, réponse
↓
Composant React → Affichage, état utilisateur, UX
```

Chaque couche a une responsabilité claire, pas d'empiètement.

**Bénéfice** : Testabilité, maintenabilité, évolutivité.

---

### 2. **Eager Loading**

❌ **Mauvais (N+1 queries)** :
```php
$records = DailyRecord::all();
foreach ($records as $record) {
    echo $record->creator->name;  // ← Query supplémentaire par record
}
```

✅ **Bon** :
```php
$records = DailyRecord::with(['creator', 'approver'])->paginate(20);
// Une seule requête pour records + creator + approver
```

**Performance impact** : Réduction de 20+ requêtes → 1 ou 2 requêtes.

---

### 3. **Validation en deux niveaux**

**Côté client (React)** :
```typescript
if (res.status === 422 && json?.errors) {
    setValidationErrors(json.errors);
    setError('Des erreurs de validation sont présentes.');
    showToast('Erreur de validation', 'error');
}
```

**Côté serveur (Laravel FormRequest)** :
```php
class StoreDailyRecordRequest extends FormRequest
{
    public function rules()
    {
        return [
            'date' => 'required|date|after_or_equal:today',
            'losses' => 'required|integer|min:0',
            'eggs' => 'required|integer|min:0',
            'notes' => 'nullable|string|max:500',
        ];
    }
}
```

**Avantages** :
- UX rapide côté client (validation locale).
- Sécurité côté serveur (validation obligatoire, impossible à contourner).

---

### 4. **Content Negotiation**

Le **même endpoint** peut retourner Inertia ou JSON selon le header `Accept` :

```php
if (request()->wantsJson()) {
    return response()->json(['records' => $records]);
} else {
    return Inertia::render('Flocks/Partials/DailyRecords', [...]);
}
```

**Bénéfice** : Flexibilité. Un contrôleur peut servir plusieurs formats sans duplication.

---

### 5. **CSRF Protection**

Le frontend lit le token et l'envoie dans les headers :

```typescript
function getCsrfToken(): string | null {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta?.content) return meta.content;
    
    // Fallback : XSRF-TOKEN cookie (encodé)
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

function buildHeaders(contentType?: string) {
    const headers = { Accept: 'application/json' };
    const token = getCsrfToken();
    if (token) {
        headers['X-CSRF-TOKEN'] = token;
        headers['X-XSRF-TOKEN'] = token;  // Fallback
    }
    return headers;
}
```

**Sécurité** : Empêche les requêtes cross-origin non autorisées (CSRF attacks).

---

### 6. **Route Model Binding**

```php
// Route : POST /daily-records/{dailyRecord}/approve
public function approve(ApproveDailyRecordRequest $request, DailyRecord $dailyRecord)
{
    // Laravel charge automatiquement le record via {dailyRecord}
    // Si l'ID n'existe pas → 404 automatique
}
```

**Avantage** : Pas de `DailyRecord::findOrFail()` manuel ; Laravel gère.

---

### 7. **Autorisation unifiée**

```php
// Dans le contrôleur
$this->authorize('approve', $dailyRecord);

// Correspond à ApproveDailyRecordRequest::authorize()
public function authorize()
{
    // Régle personnalisée : approbateur doit avoir permission 'approve-record'
    return $this->user()->can('approve-daily-record');
}
```

**Avantage** : Sécurité centralisée, pas d'accès non autorisé possible.

---

### 8. **Pagination native**

```php
$records->paginate(20);  // Laravel retourne meta data

{
  "data": [...],
  "current_page": 1,
  "last_page": 5,
  "per_page": 20,
  "total": 100
}
```

**Frontend** :
```typescript
const goToPage = (page: number) => {
    setCurrentPage(page);
    fetchRecords(page);  // Réfetches with ?page=X
};
```

---

### 9. **Composants réutilisables**

```typescript
<DailyRecords initialFlock={selectedFlock} />
```

Peut être utilisé dans :
- Modal Flocks/Index
- Page dédiée /daily-records
- Rapport d'activité

**Bénéfice** : DRY (Don't Repeat Yourself).

---

### 10. **Gestion d'erreurs progressive**

```typescript
try {
    const res = await fetch(...);
    if (!res.ok) {
        const msg = json?.message || raw || `${res.status} ${res.statusText}`;
        setError(`Erreur (${res.status}): ${msg}`);
    }
} catch (e) {
    setError('Erreur réseau: vérifiez votre connexion.');
}
```

**UX** : Affiche le problème à l'utilisateur (timeout, 422 validation, 500 serveur, etc.).

---

## Flux de données complet

### Scénario 1 : Charger les records

```
1. Utilisateur ouvre Flocks/Index
   ↓
2. Clique sur "Suivi" → Modal se montre
   ↓
3. <DailyRecords initialFlock={flock} /> monte
   ↓
4. useEffect déclenche fetchRecords()
   ↓
5. Frontend FETCH GET /flocks/1/daily-records?page=1
   Headers: Accept: application/json, X-CSRF-TOKEN: ...
   ↓
6. DailyRecordController::index() répond
   ↓
7. Retourne JSON { records: {...}, current_page: 1, ... }
   ↓
8. Frontend setState(records)
   ↓
9. Tableau affiche les enregistrements
```

---

### Scénario 2 : Soumettre un nouveau record

```
1. Utilisateur clique "Nouveau suivi"
   ↓
2. Modal formulaire apparaît
   ↓
3. Utilisateur remplit date, pertes, œufs, notes
   ↓
4. Clique "Soumettre"
   ↓
5. handleDailySubmit() :
   - Validation côté client (date présente, nombres positifs, etc.)
   - POST /daily-records avec body JSON
   ↓
6. StoreDailyRecordRequest valide côté serveur
   ↓
7. DailyRecordController::store() crée le record
   ```
   DailyRecord::create([
       'flock_id' => 1,
       'date' => '2026-02-20',
       'losses' => 2,
       'eggs' => 145,
       'notes' => 'Conditions normales',
       'status' => 'pending',
       'created_by' => Auth::id(),
   ])
   ```
   ↓
8. Retourne 201 { message: 'Record créé' }
   ↓
9. Frontend affiche toast "Suivi créé"
   ↓
10. Frontend appelle fetchRecords() pour rafraîchir
    ↓
11. Nouveau record apparaît en haut du tableau (status = pending)
```

---

### Scénario 3 : Approuver un record

```
1. Responsable voit un record avec status = 'pending'
   ↓
2. Clique l'icône ✓ (approve)
   ↓
3. handleApprove(recordId) :
   - POST /daily-records/5/approve
   - Headers: CSRF token, credentials: same-origin
   ↓
4. ApproveDailyRecordRequest autorise
   ↓
5. DailyRecordController::approve() :
   ```
   UPDATE daily_records SET
       status = 'approved',
       approved_by = 3,     // Auth::id()
       approved_at = now()
   WHERE id = 5
   ```
   - Met à jour flock.current_quantity
   ↓
6. Retourne 200 { message: 'Approuvé' }
   ↓
7. Frontend affiche toast "Suivi approuvé"
   ↓
8. Frontend rafraîchit fetchRecords()
   ↓
9. Record s'affiche avec status = 'approved' (badge vert)
   ↓
10. Boutons approve/reject disparaissent (pas d'action si approved)
```

---

## Pourquoi cette architecture est bonne

### ✅ Sécurité
- Validation serveur obligatoire (impossible à contourner).
- CSRF protection via tokens.
- Autorisation par politiques Laravel.
- Secrets côté serveur jamais exposés.

### ✅ Performance
- Eager loading (pas de N+1 queries).
- JSON endpoints sans overhead Inertia.
- Pagination native.
- Only-json responses (pas de HTML inutile).

### ✅ Maintenabilité
- Séparation claire des responsabilités.
- Logique métier centralisée (modèle).
- Composants réutilisables.
- Pas de doublons entre Inertia et XHR.

### ✅ UX
- Pas de rechargement full-page.
- Loading spinners pour ressources async.
- Toast messages pour feedback utilisateur.
- Validation côté client (feedback rapide).
- Messages d'erreur détaillés.

### ✅ Testabilité
- Modèles testables indépendamment.
- Contrôleurs testables (endpoints JSON).
- Composants React testables.
- Pas de couplage fort.

### ✅ Flexibilité
- Même endpoint peut servir Inertia OU JSON.
- Composant peut être réutilisé partout.
- Facile d'ajouter des formats (CSV, PDF).
- Facile de changer l'UI sans toucher le backend.

---

## Résumé

| Aspect | Approche |
|---|---|
| **Modèle** | Relations typées, casts automatiques, scopes |
| **Contrôleur** | Validation FormRequest, autorisation, content negotiation |
| **Frontend** | Composant autonome, fetch XHR, état local React |
| **Sécurité** | CSRF tokens, autorisation, validation serveur |
| **Performance** | Eager loading, pagination, endpoints JSON légers |
| **UX** | Toasts, loading indicators, erreurs détaillées |

Cette approche combine le meilleur de Laravel 12 (modèles éloquents, sécurité, validation) avec la flexibilité de React (composants réutilisables, UX riche) via Inertia.

---

## Fichiers impliqués

```
app/
├── Models/
│   ├── DailyRecord.php          # Modèle + relations
│   ├── Flock.php                # Relation inverse
│   └── User.php                 # creator/approver
├── Http/
│   ├── Controllers/
│   │   └── DailyRecordController.php  # Endpoints
│   └── Requests/
│       ├── StoreDailyRecordRequest.php
│       ├── ApproveDailyRecordRequest.php
│       └── RejectDailyRecordRequest.php
├── Policies/
│   └── DailyRecordPolicy.php    # Autorisation

resources/js/pages/Flocks/
├── Index.tsx                    # Page principale
└── Partials/
    └── DailyRecords.tsx         # Composant autonome

routes/
└── web.php                      # Routes JSON + Inertia

database/
└── migrations/
    └── *_create_daily_records_table.php  # Schéma
```

---

**Document technique v1.0 — Février 2026**
