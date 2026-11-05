import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { getAppData } from '../lib/server/repo';
import { StoreProvider } from '../lib/phones/store';
import { AppShell } from '../components/shell/AppShell';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gestão de Celulares',
  description: 'Cadastro de celulares, chips e números de WhatsApp',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f6f7f9',
};

// Página gerada no servidor com os dados já embutidos e mantida em cache;
// é regerada automaticamente quando algo é alterado (ver lib/server/repo).
export const revalidate = 3600;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { phones, departments, numbers } = await getAppData();

  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <StoreProvider initialPhones={phones} initialDepartments={departments} initialNumbers={numbers}>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
