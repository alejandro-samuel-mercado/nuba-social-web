import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { GlobalBackground } from '@/components/layout/GlobalBackground';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'Nuba Club — Comunidad de Avisos, Fútbol, Streaming & TV',
  description:
    'Plataforma social privada de avisos, cartelera de fútbol, estrenos streaming con TMDB, canales NubaTV, encuestas y sorteos en vivo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <GlobalBackground />
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
