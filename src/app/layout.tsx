import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Smart Cloud Dashboard',
  description: 'Experience latency-consistency trade-offs in distributed systems through interactive consistency models.',
  keywords: ['distributed systems', 'consistency', 'latency', 'caching', 'cloud computing'],
  authors: [{ name: 'Smart Cloud Dashboard' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Smart Cloud Dashboard',
    description: 'Interactive demonstration of consistency models in distributed systems',
    type: 'website',
    locale: 'en_US',
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1f2937',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}