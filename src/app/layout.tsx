import type { Metadata } from 'next';
import { Poppins, Baloo_2, Nunito } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { GlobalBackground } from '@/components/layout/GlobalBackground';
import { AppShell } from '@/components/layout/AppShell';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
});

const baloo2 = Baloo_2({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-baloo',
});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Nuba Club — Comunidad de Avisos, Fútbol, Streaming & TV',
  description:
    'Plataforma social cerrada de avisos, cartelera de fútbol, estrenos streaming con TMDB, canales NubaTV, encuestas y sorteos en vivo.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${baloo2.variable} ${nunito.variable} font-sans antialiased`}
      >
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
