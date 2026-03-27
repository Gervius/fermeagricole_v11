export function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline gap-2">
            <span className="text-stone-500 min-w-[80px] text-xs">{label} :</span>
            <span className="text-stone-900 font-medium text-sm">{value}</span>
        </div>
    );
}