import translations from '../lang/fr.json';

type TranslationKey = keyof typeof translations | string;

export function t(key: string, variables?: Record<string, string>): string {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            return key; // return key if not found
        }
    }

    if (typeof value === 'string' && variables) {
        return value.replace(/:\w+/g, (match) => {
            const varName = match.substring(1);
            return variables[varName] !== undefined ? variables[varName] : match;
        });
    }

    return typeof value === 'string' ? value : key;
}
