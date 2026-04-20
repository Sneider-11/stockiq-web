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
    <div className="flex h-screen overflow-hidden bg-spc">
      {/* Sidebar — oculto en móvil, visible en desktop */}
      <div className="hidden lg:flex no-print">
        <Sidebar user={user} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
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
