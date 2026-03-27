<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Requests\StoreDailyRecordRequest;
use App\Http\Requests\ApproveDailyRecordRequest;
use App\Http\Requests\RejectDailyRecordRequest;
use App\Models\DailyRecord;
use App\Models\Flock;
use App\Models\EggStock;
use App\Models\Recipe;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;


class DailyRecordController extends Controller
{

    use AuthorizesRequests;
    public function index(Flock $flock)
    {
        try {
            $this->authorize('viewAny', DailyRecord::class);
        } catch (AuthorizationException $e) {
            if (request()->wantsJson()) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }
            abort(403);
        }

        $records = $flock->dailyRecords()
            ->with(['creator', 'approver', 'feedType', 'flock'])
            ->orderBy('date', 'desc')
            ->paginate(5)
            ->through(fn ($record) => [
                'id' => $record->id,
                'date' => $record->date->format('Y-m-d'),
                'losses' => $record->losses,
                'eggs' => $record->eggs,
                'feed_type_name' => $record->feedType ? $record->feedType->name : null,
                'feed_consumed' => $record->feed_consumed,
                'water_consumed' => $record->water_consumed,
                'avg_feed_per_bird' => $record->avg_feed_per_bird,
                'avg_water_per_bird' => $record->avg_water_per_bird,
                'theoretical_norm' => $record->theoretical_norm,
                'notes' => $record->notes,
                'status' => $record->status,
                'created_by' => $record->creator->name,
                'approved_by' => $record->approver?->name,
                'approved_at' => $record->approved_at?->format('d/m/Y H:i'),
                'rejection_reason' => $record->rejection_reason,
                'can_approve' => auth()->user()->can('approve', $record),
                'can_reject' => auth()->user()->can('reject', $record),
            ]);

        // Return JSON for XHR/JS fetches, otherwise render the Inertia partial
        if (request()->wantsJson()) {
            return response()->json([
                'records' => $records,
                'flock' => $flock->only('id', 'name'),
            ]);
        }

        $recipes = Recipe::select('id', 'name')->get();

        return Inertia::render('Flocks/Partials/DailyRecords', [
            'records' => $records,
            'flock' => $flock->only('id', 'name'),
            'recipes' => $recipes,
        ]);
    }

    
    
    public function store(StoreDailyRecordRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id();
        $data['status'] = 'pending';

        $record = DailyRecord::create($data);

        // Recharger les relations pour les afficher
        $record->load(['creator', 'approver']);

        return back()->with([
            'newRecord' => [
                'id' => $record->id,
                'date' => $record->date->format('Y-m-d'),
                'losses' => $record->losses,
                'eggs' => $record->eggs,
                'feed_type_name' => $record->feedType ? $record->feedType->name : null,
                'feed_consumed' => $record->feed_consumed,
                'water_consumed' => $record->water_consumed,
                'avg_feed_per_bird' => $record->avg_feed_per_bird,
                'avg_water_per_bird' => $record->avg_water_per_bird,
                'theoretical_norm' => $record->theoretical_norm,
                'notes' => $record->notes,
                'status' => $record->status,
                'created_by' => $record->creator->name,
                'can_approve' => auth()->user()->can('approve', $record),
                'can_reject' => auth()->user()->can('reject', $record),
            ]
        ]);
    }

    /**
     * Approuve un enregistrement.
     */
    public function approve(ApproveDailyRecordRequest $request, DailyRecord $dailyRecord)
    {
        $this->authorize('approve', $dailyRecord);

        $flock = $dailyRecord->flock;

        DB::transaction(function () use ($dailyRecord, $flock) {
            $dailyRecord->status = 'approved';
            $dailyRecord->approved_by = auth()->id();
            $dailyRecord->approved_at = now();
            $dailyRecord->save(); // ← l'observateur crée EggMovement

            // Mise à jour du lot
            
            $flock->current_quantity = max(0, $flock->current_quantity - $dailyRecord->losses);
            $flock->eggs_produced += $dailyRecord->eggs;
            $flock->save();
        });
        
        return back()->with([
            'updatedRecord' => [
                'id' => $dailyRecord->id,
                'status' => $dailyRecord->status,
                'approved_at' => $dailyRecord->approved_at->format('d/m/Y H:i'),
            ],
            'updatedFlock' => [
                'id' => $flock->id,
                'current_quantity' => $flock->current_quantity,
                'eggs_produced' => $flock->eggs_produced,
            
            ],
        ]);
    }

    /**
     * Rejette un enregistrement.
     */
    public function reject(RejectDailyRecordRequest $request, DailyRecord $dailyRecord)
    {
        $this->authorize('reject', $dailyRecord);

        $dailyRecord->status = 'rejected';
        $dailyRecord->approved_by = auth()->id(); // ou un champ rejected_by si vous préférez
        $dailyRecord->approved_at = now();
        $dailyRecord->rejection_reason = $request->reason;
        $dailyRecord->save();

        return back()->with([
            'updatedRecord' => [
                'id' => $dailyRecord->id,
                'status' => $dailyRecord->status,
                'rejection_reason' => $dailyRecord->rejection_reason,
                'approved_at' => $dailyRecord->approved_at->format('d/m/Y H:i'),
            ]
        ]);
    }

    public function indexForModal(Flock $flock, Request $request)
    {
        $records = $flock->dailyRecords()
        ->with(['creator', 'approver', 'feedType', 'flock'])
        ->orderBy('date', 'desc')
        ->paginate(20)
        ->through(fn ($record) => [
            'id' => $record->id,
            'date' => $record->date->format('Y-m-d'),
            'losses' => $record->losses,
            'eggs' => $record->eggs,
            'feed_type_name' => $record->feedType ? $record->feedType->name : null,
            'feed_consumed' => $record->feed_consumed,
            'water_consumed' => $record->water_consumed,
            'avg_feed_per_bird' => $record->avg_feed_per_bird,
            'avg_water_per_bird' => $record->avg_water_per_bird,
            'theoretical_norm' => $record->theoretical_norm,
            'notes' => $record->notes,
            'status' => $record->status,
            'created_by' => $record->creator->name,
            'approved_by' => $record->approver?->name,
            'approved_at' => $record->approved_at?->format('d/m/Y H:i'),
            'rejection_reason' => $record->rejection_reason,
            'can_approve' => auth()->user()->can('approve', $record),
            'can_reject' => auth()->user()->can('reject', $record),
        ]);

        $recipes = Recipe::select('id', 'name')->get();

        return Inertia::render('Flocks/Partials/RecordsOnly', [
            'records' => $records,
            'flock' => $flock->only('id', 'name'),
            'recipes' => $recipes,
        ]);
    }
}
