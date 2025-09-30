import type { Metadata, Viewport } from 'next';
import { Albert_Sans, Bungee } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import { PerformanceDashboardProvider } from '@/lib/context/PerformanceDashboardContext';
import './globals.css';

const albertSans = Albert_Sans({ 
  subsets: ['latin'],
  variable: '--font-albert-sans',
});

const bungee = Bungee({ 
  subsets: ['latin'],
  weight: '400',
  variable: '--font-bungee',
});

export const metadata: Metadata = {
  title: 'LatentSee',
  description: 'Discover hidden patterns in real-time: See how cloud systems balance speed vs correctness in e-commerce scenarios',
  keywords: ['AI', 'e-commerce', 'insights', 'neural caching', 'real-time analytics', 'latency analysis'],
  authors: [{ name: 'LatentSee Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'LatentSee',
    description: 'Discover hidden patterns in real-time: See how cloud systems balance speed vs correctness in e-commerce scenarios',
    type: 'website',
    locale: 'en_US',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1B1F3B', // Deep Space Indigo
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${albertSans.variable} ${bungee.variable}`}>
      <body className="font-body bg-slate-900 text-white antialiased">
        <AuthProvider>
          <PerformanceDashboardProvider>
            {children}
          </PerformanceDashboardProvider>
        </AuthProvider>
      </body>
    </html>
  );
}