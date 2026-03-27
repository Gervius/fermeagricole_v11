<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ------------------------------------------------------------
        // 1. Définir toutes les permissions
        // ------------------------------------------------------------

        // Utilisateurs & Rôles
        $userPermissions = [
            'view users', 'create users', 'edit users', 'delete users',
        ];
        $rolePermissions = [
            'view roles', 'create roles', 'edit roles', 'delete roles',
        ];
        $permissionPermissions = [
            'view permissions', 'assign permissions',
        ];

        // Bâtiments
        $buildingPermissions = [
            'view buildings', 'create buildings', 'edit buildings', 'delete buildings',
        ];

        // Lots
        $flockPermissions = [
            'view flocks', 'create flocks', 'edit flocks', 'delete flocks',
            'submit flocks', 'approve flocks', 'reject flocks', 'end flocks',
        ];

        // Enregistrements journaliers
        $dailyRecordPermissions = [
            'view daily records', 'create daily records',
            'approve daily records', 'reject daily records',
        ];

        // Unités
        $unitPermissions = [
            'view units', 'create units', 'edit units', 'delete units',
        ];

        // Ingrédients
        $ingredientPermissions = [
            'view ingredients', 'create ingredients', 'edit ingredients', 'delete ingredients',
        ];

        // Mouvements de stock
        $stockMovementPermissions = [
            'view stock movements', 'create stock movements',
            'approve stock movements', 'reject stock movements',
        ];

        // Recettes
        $recipePermissions = [
            'view recipes', 'create recipes', 'edit recipes', 'delete recipes',
        ];

        // Productions d'aliments
        $feedProductionPermissions = [
            'view feed productions', 'create feed productions',
            'submit feed productions', 'approve feed productions', 'reject feed productions',
        ];

        // Traitements
        $treatmentPermissions = [
            'view treatments', 'create treatments', 'edit treatments', 'delete treatments',
            'approve treatments', 'reject treatments',
        ];

        // Ventes de lots
        $flockSalePermissions = [
            'view flock sales', 'create flock sales', 'edit flock sales', 'delete flock sales',
            'approve flock sales', 'reject flock sales',
        ];

        // Ventes d'œufs
        $eggSalePermissions = [
            'view egg sales', 'create egg sales', 'edit egg sales', 'delete egg sales',
            'approve egg sales', 'cancel egg sales',
        ];

        // Factures
        $invoicePermissions = [
            'view invoices', 'create invoices', 'edit invoices', 'delete invoices',
            'approve invoices', 'cancel invoices', 'add payments',
        ];

        // Paiements
        $paymentPermissions = [
            'view payments',
        ];

        // Partenaires
        $partnerPermissions = [
            'view partners', 'create partners', 'edit partners', 'delete partners',
        ];

        // Comptabilité générale
        $accountingPermissions = [
            'view accounts', 'create accounts', 'edit accounts', 'delete accounts',
            'view journal vouchers', 'post journal vouchers',
            'view analytical accounts', 'manage analytical accounts',
        ];

        // Rapports
        $reportPermissions = [
            'view reports',
        ];

        // Fusionner toutes les permissions
        $allPermissions = array_merge(
            $userPermissions,
            $rolePermissions,
            $permissionPermissions,
            $buildingPermissions,
            $flockPermissions,
            $dailyRecordPermissions,
            $unitPermissions,
            $ingredientPermissions,
            $stockMovementPermissions,
            $recipePermissions,
            $feedProductionPermissions,
            $treatmentPermissions,
            $flockSalePermissions,
            $eggSalePermissions,
            $invoicePermissions,
            $paymentPermissions,
            $partnerPermissions,
            $accountingPermissions,
            $reportPermissions
        );

        // Créer les permissions (guard web)
        foreach ($allPermissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ------------------------------------------------------------
        // 2. Créer les rôles
        // ------------------------------------------------------------
        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $adminRole      = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $directorRole   = Role::firstOrCreate(['name' => 'Directeur', 'guard_name' => 'web']);
        $managerRole    = Role::firstOrCreate(['name' => 'Gestionnaire', 'guard_name' => 'web']);
        $secretaryRole  = Role::firstOrCreate(['name' => 'Secrétaire', 'guard_name' => 'web']);

        // ------------------------------------------------------------
        // 3. Assigner les permissions aux rôles
        // ------------------------------------------------------------

        // Super Admin : on lui donne tout (mais on peut aussi utiliser les gates)
        $superAdminRole->givePermissionTo($allPermissions);

        // Admin : tout
        $adminRole->givePermissionTo($allPermissions);

        // Directeur : tout sauf gestion des utilisateurs/rôles/permissions
        $directorPermissions = array_merge(
            $buildingPermissions,
            $flockPermissions,
            $dailyRecordPermissions,
            $unitPermissions,
            $ingredientPermissions,
            $stockMovementPermissions,
            $recipePermissions,
            $feedProductionPermissions,
            $treatmentPermissions,
            $flockSalePermissions,
            $eggSalePermissions,
            $invoicePermissions,
            $paymentPermissions,
            $partnerPermissions,
            $accountingPermissions, // consultation possible
            $reportPermissions,
            ['view users'] // peut voir les utilisateurs
        );
        $directorRole->givePermissionTo($directorPermissions);

        // Gestionnaire : métier avec approbation, sans comptabilité ni gestion utilisateurs
        $managerPermissions = array_merge(
            $buildingPermissions,
            $flockPermissions, // y compris approve, reject, end
            $dailyRecordPermissions,
            $unitPermissions,
            $ingredientPermissions,
            $stockMovementPermissions,
            $recipePermissions,
            $feedProductionPermissions,
            $treatmentPermissions,
            $flockSalePermissions,
            $eggSalePermissions,
            $invoicePermissions, // y compris approve, cancel, add payments
            $paymentPermissions,
            $partnerPermissions,
            $reportPermissions // consultation des rapports
        );
        $managerRole->givePermissionTo($managerPermissions);

        // Secrétaire : saisie sans approbation
        $secretaryPermissions = [
            // Visualisation
            'view flocks', 'view buildings', 'view daily records', 'view units',
            'view ingredients', 'view stock movements', 'view recipes',
            'view feed productions', 'view treatments', 'view flock sales',
            'view egg sales', 'view invoices', 'view payments', 'view partners',
            // Création (brouillon / en attente)
            'create flocks', 'create daily records', 'create stock movements',
            'create treatments', 'create feed productions', 'create flock sales',
            'create egg sales', 'create invoices', 'create partners',
            // Pas d'approbation
        ];
        $secretaryRole->givePermissionTo($secretaryPermissions);

        // ------------------------------------------------------------
        // 4. Créer des utilisateurs de test avec les rôles
        // ------------------------------------------------------------
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@example.com'],
            ['name' => 'Super Admin', 'password' => bcrypt('password')]
        );
        $superAdmin->assignRole($superAdminRole);

        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin User', 'password' => bcrypt('password')]
        );
        $admin->assignRole($adminRole);

        $director = User::firstOrCreate(
            ['email' => 'director@example.com'],
            ['name' => 'Director User', 'password' => bcrypt('password')]
        );
        $director->assignRole($directorRole);

        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            ['name' => 'Manager User', 'password' => bcrypt('password')]
        );
        $manager->assignRole($managerRole);

        $secretary = User::firstOrCreate(
            ['email' => 'secretary@example.com'],
            ['name' => 'Secretary User', 'password' => bcrypt('password')]
        );
        $secretary->assignRole($secretaryRole);
    }
}