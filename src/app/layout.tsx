import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ChatProvider } from '@/components/providers/chat-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Landing-Gen - WordPress Block Theme Generator',
  description: 'Create professional WordPress block themes for landing pages with live preview and clean export',
  keywords: ['WordPress', 'themes', 'landing pages', 'block themes', 'generator'],
  authors: [{ name: 'Aydin' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark">
          <ChatProvider>
            {children}
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}