# Proposition d'Architecture : Module de Facturation ERP

## 1. 🔄 Workflow & Machine à États

Le cycle de vie d'une facture est strictement contrôlé pour assurer la conformité et la sécurité.

**États possibles :**
- `draft` : Brouillon, modifiable par le créateur. C'est l'état initial.
- `pending_approval` : Soumise pour approbation. Non modifiable.
- `approved` : Approuvée par tous les niveaux requis. Prête à être émise.
- `rejected` : Rejetée par un approbateur (avec commentaire). Retourne en `draft` pour modification.
- `issued` : Émise au client (numéro de facture généré à cette étape).
- `paid` : Payée (totalement).
- `cancelled` : Annulée. Accessible depuis n'importe quel état.

**Schéma de transition :**
```text
[Création] -> draft -> [Soumission] -> pending_approval
                                          |-> [Approbation Niveaux 1..N] -> approved -> [Émission] -> issued -> [Paiement] -> paid
                                          |-> [Rejet] -> (retour en) draft
[* N'importe quel état] -> [Annulation] -> cancelled
```

## 2. 👥 Système d'Approbation Dynamique (DB-Driven)

L'approbation est basée sur des étapes configurables en base de données (`workflow_steps`).

- **Multi-niveaux :** Les étapes sont définies globalement avec un ordre (ex: Étape 1 = Gestionnaire, Étape 2 = Directeur).
- **Rôle supérieur :** Chaque étape nécessite l'approbation d'un rôle spécifique.
- **Fallback :** Si un rôle n'est pas disponible (ou après un délai), un rôle de "fallback" (ex: Admin) peut intervenir.
- **Rejet :** Un rejet nécessite obligatoirement un commentaire et renvoie la facture au statut `draft`. L'historique des rejets est conservé.

## 3. 🧠 Architecture Backend (Laravel)

Séparation stricte des responsabilités (Clean Architecture / Service Pattern) :

- **Contrôleurs (`InvoiceController`, `InvoiceApprovalController`) :** Gèrent uniquement les requêtes HTTP, l'autorisation (Policies) et les réponses JSON/Inertia.
- **Services :**
  - `InvoiceService` : Création, modification, émission, annulation, génération du numéro de facture.
  - `ApprovalService` : Logique de transition de workflow, détermination du prochain approbateur, validation/rejet.
- **Observers / Events (`InvoiceObserver`, `InvoiceSubmitted`, `InvoiceApproved`) :** Déclenchement de l'audit et des notifications de manière asynchrone pour ne pas bloquer l'UI.
- **Audit Logging :** Un service ou observer dédié qui enregistre les modifications de champs dans `invoice_audit_logs`.

## 4. 🗃️ Modélisation des Données (Migrations)

### `invoices` (mise à jour)
- `status` (string/enum)
- `workflow_step_id` (nullable, foreign key vers l'étape actuelle)
- `invoice_number` (nullable, généré à l'état `issued`)

### `workflow_steps` (nouveau)
- `id`, `name` (ex: "Validation Manager")
- `role_id` (le rôle requis pour approuver)
- `order` (entier pour ordonner les étapes)
- `is_active` (boolean)

### `invoice_approvals` (nouveau)
- `invoice_id`
- `workflow_step_id`
- `user_id` (qui a approuvé/rejeté)
- `action` (approved, rejected)
- `comments` (text, obligatoire si rejected)
- `created_at`

### `invoice_audit_logs` (nouveau)
- `invoice_id`
- `user_id` (qui a fait l'action)
- `action` (created, submitted, approved, rejected, modified, cancelled)
- `old_values` (json)
- `new_values` (json)
- `created_at`

## 5. 🔐 Autorisation (RBAC)

Utilisation de `spatie/laravel-permission` et des Policies Laravel.

**Rôles suggérés :** `admin`, `Gestionnaire`, `Directeur`, `Secrétaire` (commercial/créateur).

**InvoicePolicy :**
- `update(User, Invoice)` : Vrai seulement si `status == 'draft'` et l'utilisateur est créateur ou admin.
- `submit(User, Invoice)` : Vrai si `status == 'draft'`.
- `approve(User, Invoice)` : Vrai si `status == 'pending_approval'` et l'utilisateur possède le rôle défini dans l'étape actuelle du workflow (`invoice->currentStep->role`).
- `cancel(User, Invoice)` : Vrai si l'utilisateur a la permission `cancel_invoices`.

## 6. 🧾 Audit & Traçabilité

- **Changements de données :** Lors d'un `update` sur une facture, `InvoiceObserver` compare les `getDirty()` et `getOriginal()` et insère une ligne dans `invoice_audit_logs` avec l'ancienne et la nouvelle valeur (JSON).
- **Actions métier :** Les actions comme "Soumission" ou "Approbation" ajoutent également un log spécifique avec le commentaire associé.

## 7. ⚛️ Frontend (React + Inertia)

- **UI Composants :**
  - Un badge de statut coloré (Gris=Draft, Bleu=Pending, Vert=Approved, Rouge=Rejected/Cancelled).
  - Une `Timeline` ou `Historique` (basé sur `invoice_audit_logs` et `invoice_approvals`) affichée sur la page de détail de la facture.
- **Actions (Boutons conditionnels) :**
  - Bouton "Soumettre pour validation" (seulement en draft).
  - Boutons "Approuver" et "Rejeter" (visibles uniquement si l'utilisateur courant a le droit d'approuver l'étape en cours).
  - Modale pour saisir un commentaire lors du clic sur "Rejeter".
- **Feedback :** Utilisation de toasts (Sonner) pour confirmer les actions (succès/erreur).

## 8. 📬 Notifications

Implémentation via `Illuminate\Notifications\Notification`.
- `InvoiceSubmittedNotification` : Envoyée par email + in-app aux utilisateurs ayant le rôle requis par la première étape du workflow.
- `InvoiceApprovedNotification` : Envoyée au créateur de la facture et aux approbateurs de l'étape suivante (le cas échéant).
- `InvoiceRejectedNotification` : Envoyée au créateur avec le commentaire de rejet.

## 9. 🧪 Qualité & Tests

- **Tests Unitaires (Pest) :**
  - `ApprovalServiceTest` : Vérifier que l'étape suivante est correctement déterminée, que la facture passe en `approved` si c'est la dernière étape, ou retourne en `draft` si rejetée.
  - `InvoicePolicyTest` : Vérifier que seuls les bons rôles peuvent approuver.
- **Tests Fonctionnels (HTTP) :**
  - Soumettre une facture, l'approuver avec le bon rôle, tenter de l'approuver avec un mauvais rôle (attendre un 403 Forbidden).
