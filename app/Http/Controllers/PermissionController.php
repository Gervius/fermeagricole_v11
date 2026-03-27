<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index(): Response
    {
        $this->authorize('view permissions');

        $permissions = Permission::paginate(15);

        return Inertia::render('Permissions/Index', [
            'permissions' => $permissions,
        ]);
    }
}
