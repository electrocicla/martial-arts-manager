import { ArrowRight, CalendarDays, CheckCircle2, Instagram, TrendingUp, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ACADEMY_BRAND } from './catalog';
import { getManzurCopy } from './manzurCopy';

/** Original vector art and copy only: no implied native artwork licensing or fabricated academy statistics. */
export default function ManzurLandingPage() {
  const { i18n } = useTranslation();
  const words = getManzurCopy(i18n.resolvedLanguage ?? i18n.language);

  const features = [
    { icon: CalendarDays, title: words.scheduleTitle, description: words.scheduleDescription, label: '01' },
    { icon: CheckCircle2, title: words.attendanceTitle, description: words.attendanceDescription, label: '02' },
    { icon: TrendingUp, title: words.progressTitle, description: words.progressDescription, label: '03' },
  ] as const;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a1217] text-[#f5f0e7]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_12%,rgba(207,167,101,.13),transparent_40%),radial-gradient(ellipse_at_5%_70%,rgba(87,112,122,.12),transparent_45%)]" />
      <header className="relative z-20 border-b border-[#cfa765]/20 bg-[#0a1217]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" className="flex items-center gap-3 rounded-md outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#e8c887]" aria-label={ACADEMY_BRAND.fullName}>
            <img src={ACADEMY_BRAND.iconUrl} alt="" className="h-12 w-12 rounded-xl" width="48" height="48" />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-black tracking-[.12em] sm:text-lg">{ACADEMY_BRAND.name}</span>
              <span className="text-[10px] font-medium uppercase tracking-[.24em] text-[#d6b67e]">ARTES MARCIALES</span>
            </span>
          </Link>
          <nav aria-label="Navegación principal" className="flex items-center gap-2 sm:gap-5">
            <a href="#plataforma" className="hidden rounded-md px-2 py-2 text-sm text-[#d3d5d0] transition hover:text-white focus-visible:outline-2 focus-visible:outline-[#e8c887] sm:inline-flex">
              {words.explore}
            </a>
            <Link to="/login" className="inline-flex min-h-11 items-center rounded-lg border border-[#d1af71]/55 px-4 py-2 text-sm font-semibold text-[#f2d49a] transition hover:bg-[#d1af71]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8c887] sm:px-6">
              {words.login}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid min-h-[min(760px,85vh)] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:gap-16 lg:px-12 lg:py-28">
          <div className="relative z-10 max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-3 text-xs font-bold tracking-[.3em] text-[#dabb83] uppercase">
              <span className="h-px w-9 bg-[#cfa765]" /> {words.eyebrow}
            </p>
            <h1 className="text-5xl font-extrabold leading-[1.06] tracking-tight sm:text-6xl lg:text-7xl">
              {words.heroLeading}<br /><span className="bg-gradient-to-r from-[#e7c98f] via-[#cfa765] to-[#a47f44] bg-clip-text text-transparent">{words.heroEmphasis}</span>
            </h1>
            <p className="mt-8 max-w-xl text-base leading-8 text-[#c9cece] sm:text-lg">{words.heroDescription}</p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/register" className="group inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#d5ad6b] px-6 py-3 font-bold text-[#10181b] shadow-lg shadow-[#d5ad6b]/15 transition hover:bg-[#ecd09b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8c887]">
                {words.getStarted} <ArrowRight aria-hidden="true" className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <a href="#plataforma" className="inline-flex min-h-12 items-center rounded-xl border border-white/20 px-6 py-3 font-semibold text-white transition hover:border-[#e0bf83] hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#e8c887]">
                {words.explore}
              </a>
            </div>
            <div className="mt-12 flex items-center gap-3 border-t border-white/10 pt-6 text-sm text-[#bfc9c9]">
              <UsersRound aria-hidden="true" className="h-5 w-5 text-[#cfa765]" /> {words.tagline}
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[430px] items-center justify-center lg:ml-auto" aria-hidden="true">
            <div className="absolute inset-[8%] rounded-full border border-[#e4c58c]/15 [transform:rotate(-24deg)]" />
            <div className="absolute inset-[17%] rounded-full border border-[#e4c58c]/30" />
            <div className="absolute -inset-3 rounded-[3rem] bg-gradient-to-br from-[#d5af6b]/10 via-transparent to-[#435c63]/10 blur-2xl" />
            <div className="relative flex aspect-square w-[78%] items-center justify-center rounded-[3rem] border border-[#cfa765]/35 bg-gradient-to-br from-[#1c2b30] to-[#0c151a] p-12 shadow-[0_30px_90px_rgba(0,0,0,.46)]">
              <img src={ACADEMY_BRAND.iconUrl} alt="" className="h-full w-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,.4)]" />
            </div>
            <span className="absolute -bottom-5 right-1 rounded-xl border border-[#cfa765]/35 bg-[#16242a] px-5 py-3 text-xs font-bold uppercase tracking-[.22em] text-[#e5c586] sm:right-0">
              DISCIPLINA · COMUNIDAD
            </span>
          </div>
        </section>

        <section id="plataforma" className="relative border-y border-[#b7a27c]/15 bg-[#101c22] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#dabb83]">{words.featuresEyebrow}</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{words.featuresTitle}</h2>
            <p className="mt-5 max-w-2xl leading-7 text-[#bdc6c7]">{words.featuresDescription}</p>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description, label }) => (
                <article key={label} className="group rounded-2xl border border-[#cfa765]/20 bg-[#17262b]/75 p-7 transition hover:border-[#cfa765]/55 hover:bg-[#1b2e33]">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#cfa765]/30 bg-[#cfa765]/10 text-[#ebca8e]">
                      <Icon aria-hidden="true" className="h-6 w-6" />
                    </span>
                    <span className="text-sm font-bold tracking-widest text-[#b8a078]">{label}</span>
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
            <p className="text-xs font-bold uppercase tracking-[.28em] text-[#dabb83]">{words.communityEyebrow}</p>
            <h2 className="mt-5 max-w-xl text-3xl font-bold leading-tight sm:text-5xl">{words.communityTitle}</h2>
            <p className="mt-6 max-w-lg leading-8 text-[#bdc6c7]">{words.communityDescription}</p>
            <a href={ACADEMY_BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl border border-[#cfa765]/45 px-6 py-3 font-semibold text-[#ecd09b] transition hover:bg-[#cfa765]/10 focus-visible:outline-2 focus-visible:outline-[#e8c887]">
              <Instagram aria-hidden="true" className="h-5 w-5" /> {words.follow} <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <aside className="rounded-3xl border border-[#cfa765]/25 bg-gradient-to-br from-[#1e2f34] to-[#0e191e] p-8 shadow-xl sm:p-12">
            <div className="mb-8 flex items-center gap-4">
              <img src={ACADEMY_BRAND.iconUrl} alt="" className="h-14 w-14" />
              <span className="text-xl font-black tracking-widest">{ACADEMY_BRAND.name}</span>
            </div>
            <p className="text-lg leading-8 text-[#f4eee1]">{words.accountPrompt}</p>
            <Link to="/login" className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#d5ad6b] px-6 py-3 font-bold text-[#10181b] transition hover:bg-[#ecd09b] focus-visible:outline-2 focus-visible:outline-[#e8c887]">
              {words.portal} <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
          </aside>
        </section>
      </main>

      <footer className="border-t border-[#cfa765]/20 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 text-sm text-[#aebabc] sm:flex-row sm:px-8 lg:px-12">
          <span>{ACADEMY_BRAND.fullName}</span>
          <span>{words.tagline}</span>
        </div>
      </footer>
    </div>
  );
}
