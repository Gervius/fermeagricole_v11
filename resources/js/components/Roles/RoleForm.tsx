import React from 'react';

interface RoleFormData {
    name: string;
    permissions: number[]; // IDs des permissions sélectionnées
}

interface Props {
    data: RoleFormData;
    setData: (key: keyof RoleFormData, value: any) => void;
    errors: Record<string, string>;
    permissions: { id: number; name: string }[];
}

export default function RoleForm({ data, setData, errors, permissions }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Nom du rôle *</label>
                <input
                    type="text"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Ex: Gestionnaire"
                    required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Permissions</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-stone-200 rounded-lg p-3">
                    {permissions.map(perm => (
                        <label key={perm.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.permissions.includes(perm.id)}
                                onChange={e => {
                                    const newPerms = e.target.checked
                                        ? [...data.permissions, perm.id]
                                        : data.permissions.filter(id => id !== perm.id);
                                    setData('permissions', newPerms);
                                }}
                                className="rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                            />
                            <span className="text-sm text-stone-700">{perm.name}</span>
                        </label>
                    ))}
                </div>
                {errors.permissions && <p className="text-red-500 text-xs mt-1">{errors.permissions}</p>}
            </div>
        </div>
    );
}