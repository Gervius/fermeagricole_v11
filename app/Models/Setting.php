<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'description'];

    public static function get(string $key, mixed $default = null)
    {
        $setting = self::where('key', $key)->first();
        if (!$setting) {
            return $default;
        }

        switch ($setting->type) {
            case 'boolean':
                return (bool) $setting->value;
            case 'integer':
                return (int) $setting->value;
            case 'float':
                return (float) $setting->value;
            case 'json':
                return json_decode($setting->value, true);
            default:
                return $setting->value;
        }
    }

    public static function set(string $key, mixed $value, string $type = 'string', string $description = null)
    {
        $stringValue = $value;
        if ($type === 'boolean') {
            $stringValue = $value ? '1' : '0';
        } elseif ($type === 'json') {
            $stringValue = json_encode($value);
        }

        return self::updateOrCreate(
            ['key' => $key],
            [
                'value' => (string) $stringValue,
                'type' => $type,
                'description' => $description,
            ]
        );
    }
}
