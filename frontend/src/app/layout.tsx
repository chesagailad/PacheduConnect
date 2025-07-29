/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: layout - handles frontend functionality
 */

import './globals.css';
import { Inter, Poppins } from 'next/font/google';
import { Metadata } from 'next';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Pachedu - Send Money to Zimbabwe from South Africa',
  description: 'Fast, secure, and reliable money transfers to Zimbabwe from South Africa. Connect with your loved ones through the most trusted remittance platform.',
  keywords: 'remittance, money transfer, Zimbabwe, South Africa, EcoCash, bank transfer',
  authors: [{ name: 'Pachedu Team' }],
  openGraph: {
    title: 'Pachedu - Send Money to Zimbabwe from South Africa',
    description: 'Fast, secure, and reliable money transfers to Zimbabwe from South Africa.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pachedu - Send Money to Zimbabwe from South Africa',
    description: 'Fast, secure, and reliable money transfers to Zimbabwe from South Africa.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
} 