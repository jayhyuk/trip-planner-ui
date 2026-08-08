export default function Spinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
    </div>
  );
}
