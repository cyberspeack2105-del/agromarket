type Props = { rows?: number; className?: string };

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
      <SkeletonLine className="w-24" />
      <SkeletonLine className="w-16 h-7" />
      <SkeletonLine className="w-20 h-3" />
    </div>
  );
}

export default function LoadingSkeleton({ rows = 3, className = "" }: Props) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="skeleton h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="w-1/3" />
            <SkeletonLine className="w-1/2 h-3" />
          </div>
          <SkeletonLine className="w-16 h-3" />
        </div>
      ))}
    </div>
  );
}
