<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\AccountingRule;
use App\Models\Account;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class AccountingRuleController extends Controller
{
    public function index()
    {
        $rules = AccountingRule::with('lines.account')->get();
        return Inertia::render('AccountingRules/Index', [
            'rules' => $rules
        ]);
    }

    public function create()
    {
        $accounts = Account::select('id', 'code', 'name')->orderBy('code')->get();
        return Inertia::render('AccountingRules/Form', [
            'accounts' => $accounts,
            'rule' => null
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'event_type' => 'required|string|unique:accounting_rules,event_type',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'lines' => 'required|array|min:2',
            'lines.*.type' => 'required|in:debit,credit',
            'lines.*.account_resolution_type' => 'required|in:fixed,dynamic',
            'lines.*.account_id' => 'required_if:lines.*.account_resolution_type,fixed|nullable|exists:accounts,id',
            'lines.*.dynamic_account_placeholder' => 'required_if:lines.*.account_resolution_type,dynamic|nullable|string',
            'lines.*.amount_source' => 'required|string',
            'lines.*.percentage' => 'required|numeric|min:0|max:100',
            'lines.*.description_template' => 'nullable|string',
            'lines.*.analytical_target_source' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            $rule = AccountingRule::create([
                'name' => $validated['name'],
                'event_type' => $validated['event_type'],
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            foreach ($validated['lines'] as $lineData) {
                $rule->lines()->create($lineData);
            }
        });

        return redirect()->route('accountingRulesIndex')->with('success', 'Règle comptable créée.');
    }

    public function edit(AccountingRule $accountingRule)
    {
        $accountingRule->load('lines');
        $accounts = Account::select('id', 'code', 'name')->orderBy('code')->get();

        return Inertia::render('AccountingRules/Form', [
            'rule' => $accountingRule,
            'accounts' => $accounts
        ]);
    }

    public function update(Request $request, AccountingRule $accountingRule)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'event_type' => 'required|string|unique:accounting_rules,event_type,' . $accountingRule->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
            'lines' => 'required|array|min:2',
            'lines.*.id' => 'nullable|exists:accounting_rule_lines,id',
            'lines.*.type' => 'required|in:debit,credit',
            'lines.*.account_resolution_type' => 'required|in:fixed,dynamic',
            'lines.*.account_id' => 'required_if:lines.*.account_resolution_type,fixed|nullable|exists:accounts,id',
            'lines.*.dynamic_account_placeholder' => 'required_if:lines.*.account_resolution_type,dynamic|nullable|string',
            'lines.*.amount_source' => 'required|string',
            'lines.*.percentage' => 'required|numeric|min:0|max:100',
            'lines.*.description_template' => 'nullable|string',
            'lines.*.analytical_target_source' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $accountingRule) {
            $accountingRule->update([
                'name' => $validated['name'],
                'event_type' => $validated['event_type'],
                'description' => $validated['description'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Simple update: delete old and create new to avoid manual diffing
            $accountingRule->lines()->delete();

            foreach ($validated['lines'] as $lineData) {
                $accountingRule->lines()->create($lineData);
            }
        });

        return redirect()->route('accountingRulesIndex')->with('success', 'Règle comptable mise à jour.');
    }

    public function destroy(AccountingRule $accountingRule)
    {
        $accountingRule->delete();
        return redirect()->route('accountingRulesIndex')->with('success', 'Règle supprimée.');
    }
}
