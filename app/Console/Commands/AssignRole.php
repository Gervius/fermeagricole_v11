<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class AssignRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:assign-role';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $user = User::find($this->argument('1'));
        $role = $this->argument('Gestionnaire');
        $user->assignRole($role);
        $this->info("Rôle $role assigné à l'utilisateur {$user->email}");
    }
}
