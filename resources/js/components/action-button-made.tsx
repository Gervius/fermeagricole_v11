export function ActionButton({ icon, title, colorClass, onClick }: { icon: React.ReactNode; title: string; colorClass: string; onClick: () => void }) {
    return (
        <button onClick={onClick} title={title} className={`p-1.5 rounded-lg text-stone-400 transition-colors ${colorClass}`}>
            {icon}
        </button>
    );
}