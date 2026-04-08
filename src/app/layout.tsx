import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'StockIQ — Plataforma de Auditoría',
  description: 'Plataforma web de gestión y reportes para auditorías de inventario — Grupo Comercial AudiMeyer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full dark`}>
      <body className="h-full bg-spc text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
