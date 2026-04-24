import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PageTransition } from '@/components/layout/PageTransition';
import { ToastProvider } from '@/context/ToastContext';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden bg-spc relative">
      {/* Aurora ambient glow — behind all content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true" style={{ zIndex: 0 }}>
        <div className="aurora" />
      </div>

      {/* Sidebar — oculto en móvil, visible en desktop */}
      <div className="hidden lg:flex no-print" style={{ position: 'relative', zIndex: 1 }}>
        <Sidebar user={user} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <div className="no-print">
          <Header user={user} />
        </div>
        <main className="flex-1 overflow-y-auto">
          <ToastProvider>
            <PageTransition>
              <div className="p-6 min-h-full">
                {children}
              </div>
            </PageTransition>
          </ToastProvider>
        </main>
      </div>
    </div>
  );
}
