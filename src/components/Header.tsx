import Link from "next/link";

interface HeaderProps {
  title: string;
  backHref?: string;
  action?: React.ReactNode;
}

export default function Header({ title, backHref, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-2 px-4 py-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Back"
            className="-ml-1 rounded-full p-2 text-slate-600 hover:bg-slate-100"
          >
            ←
          </Link>
        )}
        <h1 className="flex-1 truncate text-base font-semibold text-slate-900 sm:text-lg">
          {title}
        </h1>
        {action}
      </div>
    </header>
  );
}
