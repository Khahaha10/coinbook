import type { Metadata } from 'next';
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { env } from '@/lib/env';
import { themeInitScript } from '@/lib/theme';
import { Providers } from './providers';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500'],
});

const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: 'Coinbook',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      data-theme="light"
      className={`${jakarta.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
