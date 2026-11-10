import type { Metadata, Viewport } from 'next';
import { Anton, Bricolage_Grotesque, Geist, Geist_Mono, Great_Vibes } from 'next/font/google';
import { MotionProvider } from '@/components/motion-provider';
import './globals.css';

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', weight: ['500', '600', '700', '800'] });
const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' });
const anton = Anton({ subsets: ['latin'], variable: '--font-anton', display: 'swap', weight: '400' });
const greatVibes = Great_Vibes({ subsets: ['latin'], variable: '--font-great-vibes', display: 'swap', weight: '400' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://alfizilham.my.id';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Alfiz Ilham, Fullstack Developer for AI-Integrated Applications',
    template: '%s | Alfiz Ilham',
  },
  description:
    'Alfiz Ilham builds fullstack web and mobile apps with AI built in. Computer Engineering student in Aceh, Indonesia, with 10+ live apps shipped.',
  applicationName: 'Alfiz Ilham Portfolio',
  authors: [{ name: 'Alfiz Ilham', url: siteUrl }],
  openGraph: {
    type: 'website',
    url: siteUrl,
    siteName: 'Alfiz Ilham',
    title: 'Alfiz Ilham, Fullstack Developer for AI-Integrated Applications',
    description: 'Fullstack web and mobile apps with AI built in. 10+ live apps shipped.',
    images: [{ url: '/brand/icon-512.png', width: 512, height: 512, alt: 'Alfiz Ilham logo' }],
  },
  twitter: { card: 'summary', title: 'Alfiz Ilham', description: 'Fullstack web and mobile apps with AI built in.' },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} ${anton.variable} ${greatVibes.variable}`}>
      <body className="min-h-dvh bg-bg font-sans text-fg antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
