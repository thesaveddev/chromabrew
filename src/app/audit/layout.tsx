import Link from "next/link";

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex w-full max-w-none items-center px-4 py-4 sm:px-8 lg:px-12">
          {/* Link, not an anchor: this sits inside the audit routes, and an
              anchor would reload the whole document instead of navigating. */}
          <Link href="/audit" className="text-base font-semibold">
            Website Audit
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}
