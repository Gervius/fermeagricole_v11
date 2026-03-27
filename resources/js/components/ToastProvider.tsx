import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type?: ToastType;
    duration?: number; // ms
}

interface ToastContextValue {
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToasts(): ToastContextValue {
    console.log('✅ ToastProvider mounted');
    const ctx = useContext(ToastContext);
    if (!ctx) {
        // Fallback: avoid throwing in environments where provider wasn't mounted.
        // Provide no-op implementations to prevent runtime errors and log a warning.
        return {
            addToast: (t) => {

                console.warn('[ToastProvider] addToast called without provider. Message:', t?.message);
                return 'noop';
            },
            removeToast: (id: string) => {

                console.warn('[ToastProvider] removeToast called without provider. id:', id);
            },
        } as ToastContextValue;
    }
    return ctx;
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const scheduledRef = useRef<Set<string>>(new Set());

    const removeToast = useCallback((id: string) => {
        setToasts((t) => t.filter(x => x.id !== id));
        scheduledRef.current.delete(id);
    }, []);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
        const t: Toast = { id, ...toast };
        setToasts((s) => [t, ...s]);
        return id;
    }, []);

    // Ensure auto-dismiss is scheduled for new toasts (robust across renders)
    useEffect(() => {
        toasts.forEach(t => {
            const dur = t.duration ?? 4000;
            if (dur <= 0) return;
            if (scheduledRef.current.has(t.id)) return;
            scheduledRef.current.add(t.id);
            const timer = setTimeout(() => {
                removeToast(t.id);
                clearTimeout(timer);
            }, dur);
        });
    }, [toasts, removeToast]);

    const value = useMemo(() => ({ addToast, removeToast }), [addToast, removeToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
                {toasts.map(t => (
                    <div key={t.id} className={`rounded shadow px-4 py-2 text-sm flex items-start justify-between gap-3 ${t.type === 'success' ? 'bg-emerald-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-stone-50 text-stone-800 border'}`}>
                        <div className="flex-1">{t.message}</div>
                        <button onClick={() => removeToast(t.id)} className="text-white opacity-90 hover:opacity-100 ml-3">✕</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
