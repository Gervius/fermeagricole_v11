import React from 'react';

interface UserFormData {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    roles: number[]; // IDs des rôles sélectionnés
}

interface Props {
    data: UserFormData;
    setData: (key: keyof UserFormData, value: any) => void;
    errors: Record<string, string>;
    roles: { id: number; name: string }[];
    isEditing?: boolean;
}

export default function UserForm({ data, setData, errors, roles, isEditing }: Props) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Nom *</label>
                <input
                    type="text"
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Jean Dupont"
                    required
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Email *</label>
                <input
                    type="email"
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="jean@exemple.com"
                    required
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {!isEditing && (
                <>
                    <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">Mot de passe *</label>
                        <input
                            type="password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="••••••••"
                            required
                        />
                        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">Confirmer le mot de passe *</label>
                        <input
                            type="password"
                            value={data.password_confirmation}
                            onChange={e => setData('password_confirmation', e.target.value)}
                            className="w-full px-3.5 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </>
            )}

            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">Rôles</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-stone-200 rounded-lg p-3">
                    {roles.map(role => (
                        <label key={role.id} className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={data.roles.includes(role.id)}
                                onChange={e => {
                                    const newRoles = e.target.checked
                                        ? [...data.roles, role.id]
                                        : data.roles.filter(id => id !== role.id);
                                    setData('roles', newRoles);
                                }}
                                className="rounded border-stone-300 text-amber-500 focus:ring-amber-400"
                            />
                            <span className="text-sm text-stone-700">{role.name}</span>
                        </label>
                    ))}
                </div>
                {errors.roles && <p className="text-red-500 text-xs mt-1">{errors.roles}</p>}
            </div>
        </div>
    );
}