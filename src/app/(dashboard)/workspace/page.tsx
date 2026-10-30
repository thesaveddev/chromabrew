import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export const metadata = { title: "Workspace · ChromaBrew", robots: { index: false } };

const modules = [
  { number: "01", title: "AI Design Studio", description: "Turn a product idea into an editable interface. Generate layouts, refine components and prepare designs for export.", href: "/studio", label: "Explore studio", icon: "✳", tone: "from-fuchsia-500/15 to-violet-500/5" },
  { number: "02", title: "Website Auditor", description: "Inspect accessibility, contrast, structure and SEO issues with evidence you can act on.", href: "/audit", label: "Run an audit", icon: "⌕", tone: "from-emerald-500/15 to-teal-500/5" },
  { number: "03", title: "Design Systems", description: "Create colour scales, semantic tokens, themes and developer-ready exports.", href: "/design-system", label: "Open generator", icon: "◈", tone: "from-amber-500/15 to-orange-500/5" },
  { number: "04", title: "My Projects", description: "Return to saved design systems and keep your work organised.", href: "/projects", label: "View projects", icon: "▦", tone: "from-sky-500/15 to-blue-500/5" },
];

export default async function WorkspacePage() {
  const session = await auth();
  if (!session) redirect("/sign-in");
  const firstName = session.user?.name?.trim().split(/\\s+/)[0] || "there";

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700 dark:text-fuchsia-300">Your creative workspace</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Good to see you, {firstName}.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">Create better interfaces, understand the design behind them, and make every improvement count.</p>
          </div>
          <Link href="/studio" className="inline-flex items-center gap-2 rounded-full bg-[#47003A] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5c164f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-600">✳ <span>Start a new design</span> <span aria-hidden>→</span></Link>
        </div>

        <section className="mt-10 overflow-hidden rounded-3xl bg-[#47003A] p-6 text-white shadow-xl shadow-fuchsia-950/10 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-fuchsia-100">Introducing the next chapter of ChromaBrew</span>
              <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">From first idea to a better digital experience.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-fuchsia-100/75">One connected place to design interfaces, build consistent design systems and understand how your website can improve.</p>
              <Link href="/studio" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#47003A] transition hover:bg-fuchsia-50">Explore AI Design Studio <span aria-hidden>→</span></Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><div className="text-2xl">✳</div><p className="mt-5 text-sm font-semibold">Create</p><p className="mt-1 text-xs leading-5 text-fuchsia-100/70">Shape ideas into interfaces.</p></div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><div className="text-2xl">⌕</div><p className="mt-5 text-sm font-semibold">Analyse</p><p className="mt-1 text-xs leading-5 text-fuchsia-100/70">Find issues with evidence.</p></div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><div className="text-2xl">◈</div><p className="mt-5 text-sm font-semibold">Systemise</p><p className="mt-1 text-xs leading-5 text-fuchsia-100/70">Make design consistent.</p></div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4"><div className="text-2xl">↗</div><p className="mt-5 text-sm font-semibold">Improve</p><p className="mt-1 text-xs leading-5 text-fuchsia-100/70">Turn findings into action.</p></div>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold tracking-tight">Your tools</h2><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Everything you need, working together.</p></div><span className="text-xs text-zinc-400">DESIGN · INTELLIGENCE · OPTIMISATION</span></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {modules.map((item) => <article key={item.number} className="group flex min-h-64 flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition duration-200 hover:-translate-y-1 hover:border-fuchsia-200 hover:shadow-lg hover:shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-fuchsia-900">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.tone} text-2xl text-[#47003A] dark:text-fuchsia-200`}>{item.icon}</div>
              <p className="mt-5 text-xs font-semibold tracking-widest text-zinc-400">{item.number}</p>
              <h3 className="mt-1 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{item.description}</p>
              <Link href={item.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#70005b] group-hover:gap-3 dark:text-fuchsia-300">{item.label} <span aria-hidden>→</span></Link>
            </article>)}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-semibold">A connected design workflow</p><p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">Start with a design system, create an interface, audit the result and use evidence-led recommendations to improve it.</p></div><Link href="/design-system" className="shrink-0 text-sm font-semibold text-[#70005b] dark:text-fuchsia-300">Build your foundations →</Link></div>
        </section>
      </div>
    </main>
  );
}
