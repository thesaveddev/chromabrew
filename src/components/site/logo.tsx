import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2.5 font-semibold tracking-tight text-zinc-900 ${className}`}
      aria-label="Colorsmith home"
    >
      <span
        aria-hidden
        className="grid h-7 w-7 place-items-center rounded-[8px] bg-zinc-900"
      >
        <span className="block h-2.5 w-2.5 rounded-full bg-[#c87cb3]" />
      </span>
      <span className="text-[15px]">Colorsmith</span>
    </Link>
  );
}
