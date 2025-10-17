import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ClientProviders } from '@/components/client-providers';

export const metadata: Metadata = {
  title: 'PropertEase',
  description: 'Property Management System'
};

const fontVariables = `${GeistSans.variable} ${GeistMono.variable}`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables}>
      <body className={GeistSans.className}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
