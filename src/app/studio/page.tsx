import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export const metadata = { title: "AI Design Studio · ChromaBrew", robots: { index: false } };

const examples = ["A modern SaaS analytics dashboard", "A calm, editorial wellness landing page", "A property management application"];

export default async function StudioPage() {
  const session = await auth();
  if (!session) redirect("/sign-in");
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-zinc-50 px-4 py-10 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/workspace" className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-white">← Workspace</Link>
        <div className="mx-auto mt-16 max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-semibold text-fuchsia-800 dark:border-fuchsia-900 dark:bg-fuchsia-950/40 dark:text-fuchsia-200">CHROMABREW AI DESIGN STUDIO</span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">What do you want to create?</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-500 dark:text-zinc-400">Describe an interface in your own words. The studio will bring your product idea, design system and components into one editable workspace.</p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
          <label htmlFor="design-brief" className="sr-only">Describe the interface you want to create</label>
          <textarea id="design-brief" rows={5} placeholder="Describe the product, audience, pages and visual direction you have in mind..." className="w-full resize-y border-0 bg-transparent p-3 text-base leading-7 outline-none placeholder:text-zinc-400 focus:ring-0 dark:placeholder:text-zinc-600" />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-3 pt-4 dark:border-zinc-800">
            <span className="text-xs text-zinc-400">Start with a clear product brief. You can refine it as you go.</span>
            <button type="button" disabled className="cursor-not-allowed rounded-full bg-[#47003A] px-5 py-2.5 text-sm font-semibold text-white opacity-50" title="AI generation will be enabled when the generation service is connected">Generation coming soon</button>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Need inspiration?</p><div className="mt-3 flex flex-wrap gap-2">{examples.map((example) => <span key={example} className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">{example}</span>)}</div></div>
        <div className="mx-auto mt-16 grid max-w-3xl gap-4 border-t border-zinc-200 pt-8 sm:grid-cols-3 dark:border-zinc-800">
          {[["01","Describe","Tell us what you're building."],["02","Design","Generate and refine editable UI."],["03","Export","Take your design into development."]].map(([n,title,description]) => <div key={n}><p className="text-xs font-semibold text-fuchsia-700 dark:text-fuchsia-300">{n}</p><h2 className="mt-2 font-semibold">{title}</h2><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p></div>)}
        </div>
      </div>
    </main>
  );
}
