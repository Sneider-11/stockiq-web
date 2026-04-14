import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PageTransition } from '@/components/layout/PageTransition';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden bg-spc">
      {/* Sidebar — oculto en móvil, visible en desktop */}
      <div className="hidden lg:flex">
        <Sidebar user={user} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto">
          <PageTransition>
            <div className="p-6 min-h-full">
              {children}
            </div>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
