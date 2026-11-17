import { ArrowRight, CalendarDays, CheckCircle2, Instagram, TrendingUp, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ACADEMY_BRAND } from './catalog';
import { getManzurCopy } from './manzurCopy';

/** Official Manzur Native crest; preserve its original artwork and avoid fabricated academy statistics. */
export default function ManzurLandingPage() {
  const { i18n } = useTranslation();
  const words = getManzurCopy(i18n.resolvedLanguage ?? i18n.language);

  const features = [
    { icon: CalendarDays, title: words.scheduleTitle, description: words.scheduleDescription, label: '01' },
    { icon: CheckCircle2, title: words.attendanceTitle, description: words.attendanceDescription, label: '02' },
    { icon: TrendingUp, title: words.progressTitle, description: words.progressDescription, label: '03' },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-[#fefefe]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_12%,rgba(227,18,25,.13),transparent_40%),radial-gradient(ellipse_at_5%_70%,rgba(82,82,91,.12),transparent_45%)]" />
      <header className="relative z-20 border-b border-[#e31219]/20 bg-[#050505]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" className="flex items-center gap-3 rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#ff5c63]" aria-label={ACADEMY_BRAND.fullName}>
            <img src={ACADEMY_BRAND.iconUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-contain" width="48" height="48" />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-black tracking-[.12em] sm:text-lg">{ACADEMY_BRAND.name}</span>
              <span className="text-[10px] font-medium uppercase tracking-[.24em] text-[#ff7b80]">ARTES MARCIALES</span>
            </span>
          </Link>
          <nav aria-label="Navegación principal" className="flex items-center gap-2 sm:gap-5">
            <a href="#plataforma" className="hidden rounded-md px-2 py-2 text-sm text-[#d3d5d0] transition hover:text-white focus-visible:outline-2 focus-visible:outline-[#ff5c63] sm:inline-flex">
              {words.explore}
            </a>
            <Link to="/login" className="inline-flex min-h-11 items-center rounded-lg border border-[#e31219]/55 px-4 py-2 text-sm font-semibold text-[#fefefe] transition hover:bg-[#e31219]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c63] sm:px-6">
              {words.login}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[min(760px,85vh)] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-16 lg:px-12 lg:py-28">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-3 text-xs font-bold tracking-[.3em] text-[#ff7b80] uppercase">
              <span className="h-px w-9 bg-[#e31219]" /> {words.eyebrow}
            </p>
            <h1 className="text-5xl font-extrabold leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
              {words.heroLeading}<br /><span className="bg-gradient-to-r from-[#ffb2b5] via-[#e31219] to-[#e31219] bg-clip-text text-transparent">{words.heroEmphasis}</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-[#c9cece] sm:text-lg">{words.heroDescription}</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/register" className="group inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#c51626] px-6 py-3 font-bold text-[#fefefe] shadow-lg shadow-[#c51626]/15 transition hover:bg-[#970d1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5c63]">
                {words.getStarted} <ArrowRight aria-hidden="true" className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <a href="#plataforma" className="inline-flex min-h-12 items-center rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:border-[#ff5c63] hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#ff5c63]">
                {words.explore}
              </a>
            </div>
            <div className="mt-12 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-[#bfc9c9]">
              <UsersRound aria-hidden="true" className="h-5 w-5 text-[#e31219]" /> {words.tagline}
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[430px] items-center justify-center lg:ml-auto" aria-hidden="true">
            <div className="absolute inset-[8%] rounded-full border border-[#e31219]/15 [transform:rotate(-24deg)]" />
            <div className="absolute inset-[17%] rounded-full border border-[#e31219]/30" />
            <div className="absolute -inset-3 rounded-[3rem] bg-gradient-to-br from-[#e31219]/10 via-transparent to-[#27272a]/10 blur-2xl" />
            <div className="relative flex aspect-square w-[88%] items-center justify-center rounded-[3rem] border border-[#e31219]/35 bg-gradient-to-br from-[#18181b] to-[#09090b] p-5 sm:p-7 shadow-[0_30px_90px_rgba(0,0,0,.46)]">
              <img src={ACADEMY_BRAND.iconUrl} alt="" className="h-full w-full rounded-2xl object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,.4)]" />
            </div>
            <span className="absolute -bottom-5 right-1 rounded-xl border border-[#e31219]/35 bg-[#18181b] px-5 py-3 text-xs font-bold uppercase tracking-[.22em] text-[#ff9fa4] sm:right-0">
              DISCIPLINA · COMUNIDAD
            </span>
          </div>
        </section>

        <section id="plataforma" className="relative border-y border-[#52525b]/15 bg-[#101010] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#ff7b80]">{words.featuresEyebrow}</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{words.featuresTitle}</h2>
            <p className="mt-5 max-w-2xl leading-7 text-[#bdc6c7]">{words.featuresDescription}</p>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description, label }) => (
                <article key={label} className="group rounded-2xl border border-[#e31219]/20 bg-[#18181b]/75 p-7 transition hover:border-[#e31219]/55 hover:bg-[#27272a]">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#e31219]/30 bg-[#e31219]/10 text-[#ff9fa4]">
                      <Icon aria-hidden="true" className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-bold tracking-widest text-[#a1a1aa]">{label}</span>
                  </div>
                  <h3 className="mt-8 text-xl font-bold">{title}</h3>
                  <p className="mt-3 leading-7 text-[#bac4c5]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28 lg:px-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#ff7b80]">{words.communityEyebrow}</p>
            <h2 className="mt-5 max-w-xl text-3xl font-bold leading-tight sm:text-5xl">{words.communityTitle}</h2>
            <p className="mt-6 max-w-lg leading-8 text-[#bdc6c7]">{words.communityDescription}</p>
            <a href={ACADEMY_BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl border border-[#e31219]/45 px-6 py-3 font-semibold text-[#ff9fa4] transition hover:bg-[#e31219]/10 focus-visible:outline-2 focus-visible:outline-[#ff5c63]">
              <Instagram aria-hidden="true" className="h-5 w-5" /> {words.follow} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <aside className="rounded-3xl border border-[#e31219]/25 bg-gradient-to-br from-[#18181b] to-[#09090b] p-8 shadow-xl sm:p-12">
            <div className="mb-8 flex items-center gap-4">
              <img src={ACADEMY_BRAND.iconUrl} alt="" className="h-14 w-14 shrink-0 object-contain rounded-xl" />
              <span className="text-xl font-black tracking-widest">{ACADEMY_BRAND.name}</span>
            </div>
            <p className="text-lg leading-8 text-[#fefefe]">{words.accountPrompt}</p>
            <Link to="/login" className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#c51626] px-6 py-3 font-bold text-[#fefefe] transition hover:bg-[#970d1a] focus-visible:outline-2 focus-visible:outline-[#ff5c63]">
              {words.portal} <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
          </aside>
        </section>
      </main>

      <footer className="border-t border-[#e31219]/20 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 text-sm text-[#aebabc] sm:flex-row sm:px-8 lg:px-12">
          <span>{ACADEMY_BRAND.fullName}</span>
          <span>{words.tagline}</span>
        </div>
      </footer>
    </div>
  );
}
