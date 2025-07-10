import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pachedu - Send Money to Zimbabwe from South Africa',
  description: 'Fast, secure, and reliable money transfers to Zimbabwe from South Africa. Connect with your loved ones through the most trusted remittance platform.',
  keywords: 'remittance, money transfer, Zimbabwe, South Africa, EcoCash, bank transfer',
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