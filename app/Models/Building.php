<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;



class Building extends Model
{
    protected $fillable = ['name', 'description', 'capacity'];

    public function flocks(): HasMany
    {
        return $this->hasMany(Flock::class);
    }

    public function activeFlock()
    {
        return $this->hasOne(Flock::class)->where('status', 'active');
    }
}
