import { Link, Route, Routes } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import ManzurLandingPage from './ManzurLandingPage';

function RestrictedPreviewRoute() {
  return (
    <main className="grid min-h-[calc(100svh-3rem)] place-items-center bg-[#0a1217] px-5 py-16 text-[#f5f0e7]">
      <section className="w-full max-w-lg rounded-3xl border border-[#cfa765]/35 bg-[#122025] p-8 sm:p-12">
        <LockKeyhole aria-hidden="true" className="mb-5 h-8 w-8 text-[#e7c98f]" />
        <h1 className="text-2xl font-bold">Acceso a cuentas no habilitado</h1>
        <p className="mt-4 leading-7 text-[#bdc6c7]">Esta es una vista previa visual. No ingreses credenciales reales: los alumnos, registros, pagos y datos de la academia no están conectados a esta versión.</p>
        <Link to="/" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-[#d5ad6b] px-6 py-3 font-bold text-[#10181b] focus-visible:outline-2 focus-visible:outline-offset-2">Volver a Manzur Bros</Link>
      </section>
    </main>
  );
}

/** Preview-only route tree. Never mounts authentication or private data routes. */
export default function ManzurVisualPreview() {
  return (
    <>
      <aside role="status" className="sticky top-0 z-50 border-b border-[#cfa765]/40 bg-[#17262b] px-4 py-2 text-center text-xs font-semibold text-[#f2d49a] sm:text-sm">
        Vista previa visual · Sin cuentas, pagos ni datos reales
      </aside>
      <Routes>
        <Route path="/" element={<ManzurLandingPage />} />
        <Route path="*" element={<RestrictedPreviewRoute />} />
      </Routes>
    </>
  );
}
