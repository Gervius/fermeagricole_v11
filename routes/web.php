<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\FlockController;
use App\Http\Controllers\BuildingController;
use App\Http\Controllers\DailyRecordController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\StockMouvementController;
use App\Http\Controllers\TreatmentController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\FlockSaleController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\JournalVoucherController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EggSaleController;
use App\Http\Controllers\RecipeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeedProductionController;
use App\Http\Controllers\PartnerController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\AccountingRuleController;


Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    //Route::get('/Lots', [LotController::class, 'index'])->name('generation');
    //Route::post('/Lots', [LotController::class, 'store'])->name('generationPost');

    //Route::resource('/buildings', [BuildingController::class, 'index'])->name('building');

    // Lots (flocks)
    

    Route::patch('/flocks/{flock}/submit', [FlockController::class, 'submit'])->name('flocksSubmit');
    Route::patch('/flocks/{flock}/approve', [FlockController::class, 'approve'])->name('flocksApprove');
    Route::patch('/flocks/{flock}/reject', [FlockController::class, 'reject'])->name('flocksReject');
    Route::post('/flocks/{flock}/end', [FlockController::class, 'end'])->name('flocksEnd');

    // 2. Ressources standards (index, create, store, show, edit, update, destroy)
    Route::resource('buildings', BuildingController::class)->names([
        'index'   => 'buildingsIndex',
        'create'  => 'buildingsCreate',
        'store'   => 'buildingsStore',
        'edit'    => 'buildingsEdit',
        'update'  => 'buildingsUpdate',
        'destroy' => 'buildingsDestroy',
    ])->parameters(['buildings' => 'building']);

    Route::resource('flocks', FlockController::class)->names([
        'index'   => 'generation',
        'create'  => 'flocksCreate',
        'store'   => 'flocksStore',
        'show'    => 'flocksShow',
        'edit'    => 'flocksEdit',
        'update'  => 'flocksUpdate',
        'destroy' => 'flocksDestroy',
    ])
    ->parameters([
        'flocks' => 'flock' // Garde 'flock' pour l'injection de dépendance dans le controller
    ]);

    Route::resource('unit', UnitController::class)->names([
        'index'   => 'unitsIndex',
        'create'  => 'unitsCreate',
        'store'   => 'unitsStore',
        'edit'    => 'unitsEdit',
        'update'  => 'unitsUpdate',
        'destroy' => 'unitsDestroy',
    ])
    ->parameters([
        'units' => 'unit' // Garde 'unit' pour l'injection de dépendance dans le controller
    ]);

    Route::resource('ingredients', IngredientController::class)->names([
        'index'   => 'ingredientsIndex',
        'create'  => 'ingredientsCreate',
        'store'   => 'ingredientsStore',
        'edit'    => 'ingredientsEdit',
        'update'  => 'ingredientsUpdate',
        'destroy' => 'ingredientsDestroy',
    ])
    ->parameters([
        'ingredients' => 'ingredient' // Garde 'ingredient' pour l'injection de dépendance dans le controller
    ]);

    Route::resource('recipes', RecipeController::class)->names([
        'index'   => 'recipesIndex',
        'create'  => 'recipesCreate',
        'store'   => 'recipesStore',
        'show'   => 'recipesShow',
        'edit'    => 'recipesEdit',
        'update'  => 'recipesUpdate',
        'destroy' => 'recipesDestroy',])->parameters(['recipes'=> 'recipe']);

    Route::post('/stock-movements/{stockMovement}/approve', [StockMouvementController::class, 'approve'])->name('stockMovementsApprove');
    Route::post('/stock-movements/{stockMovement}/reject', [StockMouvementController::class, 'reject'])->name('stockMovementsReject');
    Route::patch('/stock-movements/{stockMovement}/edit', [StockMouvementController::class, 'edit'])->name('stockMovementsEdit');
    Route::patch('/stock-movements/{stockMovement}/update', [StockMouvementController::class, 'update'])->name('stockMovementsUpdate');
    Route::resource('stock-movements', StockMouvementController::class)->names([
        'index'   => 'stockMovementsIndex',
        'create'  => 'stockMovementsCreate',
        'store'   => 'stockMovementsStore',
        'show'    => 'stockMovementsShow',
        'destroy' => 'stockMovementsDestroy',
    ])
    ->parameters([
        'stock-movements' => 'stockMovement'
    ]);

    Route::post('/feed-productions/{feedProduction}/submit', [FeedProductionController::class, 'submit'])->name('feedProductionsSubmit');
    Route::post('/feed-productions/{feedProduction}/approve', [FeedProductionController::class, 'approve'])->name('feedProductionsApprove');
    Route::post('/feed-productions/{feedProduction}/reject', [FeedProductionController::class, 'reject'])->name('feedProductionsReject');

    Route::resource('feed-productions', FeedProductionController::class)->names([
        'index'   => 'feedProductionsIndex',
        'create'  => 'feedProductionsCreate',
        'store'   => 'feedProductionsStore',
        'show'    => 'feedProductionsShow',
        'edit'    => 'feedProductionsEdit',
        'update'  => 'feedProductionsUpdate',
        'destroy' => 'feedProductionsDestroy',
    ])->parameters([
        'feed-productions' => 'feedProduction'
    ]);

    // Optionnel : route pour calculer les ingrédients
    Route::get('/recipes/{recipe}/calculate', [RecipeController::class, 'calculate'])->name('recipes.calculate');

    Route::post('/treatments/{treatment}/complete', [TreatmentController::class, 'complete'])->name('treatmentsComplete');
    Route::post('/treatments/{treatment}/approve', [TreatmentController::class, 'approve'])->name('treatmentsApprove');
    Route::post('/treatments/{treatment}/reject', [TreatmentController::class, 'reject'])->name('treatmentsReject');
    
    Route::resource('treatments', TreatmentController::class)->names([
        'index'   => 'treatmentsIndex',
        'create'  => 'treatmentsCreate',
        'store'   => 'treatmentsStore',
        'show'    => 'treatmentsShow',
        'edit'    => 'treatmentsEdit',
        'update'  => 'treatmentsUpdate',
        'destroy' => 'treatmentsDestroy',
    ])
    ->parameters([
        'treatments' => 'treatment'
    ]);


    Route::resource('users', UserController::class)->names([
        'index'   => 'usersIndex',
        'create'  => 'usersCreate',
        'store'   => 'usersStore',
        'show'    => 'usersShow',
        'edit'    => 'usersEdit',
        'update'  => 'usersUpdate',
        'destroy' => 'usersDestroy',
    ])->parameters(['users' => 'user']);

    // Gestion des rôles
    Route::resource('roles', RoleController::class)->names([
        'index'   => 'rolesIndex',
        'create'  => 'rolesCreate',
        'store'   => 'rolesStore',
        'show'    => 'rolesShow',
        'edit'    => 'rolesEdit',
        'update'  => 'rolesUpdate',
        'destroy' => 'rolesDestroy',
    ])->parameters(['roles' => 'role']);

    // Gestion des permissions (lecture seule)
    Route::resource('permissions', PermissionController::class)->only(['index', 'show'])->names([
        'index' => 'permissionsIndex',
        'show'  => 'permissionShow',
    ])->parameters(['permissions' => 'permission']);

    Route::get('/flocks/{flock}/daily-records', [DailyRecordController::class, 'index'])->name('suivieJournalier');
    Route::post('/daily-records', [DailyRecordController::class, 'store'])->name('suivieStore');
    Route::post('/daily-records/{dailyRecord}/approve', [DailyRecordController::class, 'approve'])->name('suivieApprove');
    Route::post('/daily-records/{dailyRecord}/reject', [DailyRecordController::class, 'reject'])->name('suivieReject');

    Route::get('/flocks/{flock}/daily-records-modal', [DailyRecordController::class, 'indexForModal'])
    ->name('flocksDailyRecords');

    // Debug route (authenticated) to inspect session CSRF token during development
    Route::get('/_debug/csrf-token', function () {
        return response()->json(['token' => session()->token()]);
    })->name('debug.csrf');



    Route::resource('accounts', AccountController::class)->names([
        'index' => 'accountsIndex', 
        'show' => 'accountShow',
        'store' => 'accountsStore',
        'update' => 'accountsUpdate',
        'destroy' => 'accountsDestroy'
    ])->parameters(['accounts' => 'account']);
    
    Route::get('/accounting/review', [JournalVoucherController::class, 'reviewIndex'])->name('accountingReview');
    Route::put('/accounting/vouchers/{journalVoucher}', [JournalVoucherController::class, 'update'])->name('journalVouchersUpdate');
    Route::post('/accounting/vouchers/{journalVoucher}/post', [JournalVoucherController::class, 'post'])->name('journalVouchersPost');

    Route::resource('journal-vouchers', JournalVoucherController::class)->only(['index', 'show'])->names([
        'index'   => 'journalVouchersIndex',
        'show'  => 'journalVoucherShow',])->parameters(['journal-vouchers' => 'journalVoucher']);
    
    Route::resource('accounting-rules', \App\Http\Controllers\AccountingRuleController::class)->names([
        'index' => 'accounting-rules.index',
        'create' => 'accounting-rules.create',
        'store' => 'accounting-rules.store',
        'edit' => 'accounting-rules.edit',
        'update' => 'accounting-rules.update',
        'destroy' => 'accounting-rules.destroy',
    ]);

    Route::resource('partners', PartnerController::class)
        ->only(['index', 'store', 'update', 'destroy'])
        ->names([
            'index' => 'partnersIndex',
            'store' => 'partnersStore',
            'update' => 'partnersUpdate',
            'destroy' => 'partnersDestroy',
        ]);
        
    Route::get('/partners/{partner}/statement', [PartnerController::class, 'downloadStatement'])->name('partnersStatement');

    Route::resource('invoices', InvoiceController::class)
        ->only(['index', 'create', 'store', 'show'])
        ->names([
            'index' => 'invoicesIndex',
            'create' => 'invoicesCreate',
            'store' => 'invoicesStore',
            'show' => 'invoicesShow',
        ]);

    // Rapports et Exports (PDF / Excel)
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoicesDownloadPdf');
    Route::get('/stock-movements/export/excel', [StockMouvementController::class, 'exportExcel'])->name('stockMovements.export');
    Route::get('/journal-vouchers/export/excel', [JournalVoucherController::class, 'exportExcel'])->name('journalVouchers.export');

    Route::post('/invoices/{invoice}/approve', [InvoiceController::class, 'approve'])->name('invoicesApprove');
    Route::post('/invoices/{invoice}/add-payment', [InvoiceController::class, 'addPayment'])->name('invoicesAddPayment');
    Route::post('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel'])->name('invoicesCancel');
    //Route::post('/invoices/{invoice}/whatsapp', [InvoiceController::class, 'sendWhatsApp'])->name('invoicesWhatsapp');
    Route::prefix('reports')->name('reports')->group(function () {
        Route::get('/balance', [ReportController::class, 'balance'])->name('Balance');
        Route::get('/income-statement', [ReportController::class, 'incomeStatement'])->name('IncomeStatement');
        Route::get('/aging', [ReportController::class, 'agingReport'])->name('Aging');
        Route::get('/balance/pdf', [ReportController::class, 'downloadBalancePdf'])->name('BalancePdf');
        Route::get('/income-statement/pdf', [ReportController::class, 'downloadIncomeStatementPdf'])->name('IncomeStatementPdf');
        Route::get('/aging/pdf', [ReportController::class, 'downloadAgingPdf'])->name('AgingPdf');
    });

    Route::resource('accounting-rules', AccountingRuleController::class)
        ->only(['index', 'create','edit','store', 'update', 'destroy'])
        ->names([
            'index' => 'accountingRulesIndex',
            'create' => 'accountingRulesCreate',
            'store' => 'accountingRulesStore',

            'update' => 'accountingRulesUpdate',
            'edit' => 'accountingRulesEdit',
            'destroy' => 'accountingRulesDestroy',
        ]);
});

require __DIR__.'/settings.php';
