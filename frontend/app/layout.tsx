import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Palms Gig - Digital Service & Gig Marketplace',
  description:
    'Connect individuals and businesses with skilled task performers. Create, post, and manage tasks on Palms Gig.',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#FF8F33',
  icons: {
    icon: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212280/palms-gig/png/logo-%284%29.png',
    apple: 'https://res.cloudinary.com/dxhjpybe7/image/upload/f_auto,q_auto/v1770212280/palms-gig/png/logo-%284%29.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 antialiased dark:bg-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
