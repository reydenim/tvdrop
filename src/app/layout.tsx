import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = 'https://tv.drop.my.id'

export const metadata: Metadata = {
  title: {
    default: 'TVDROP — Nonton TV Online Indonesia & Internasional',
    template: '%s | TVDROP',
  },
  description: 'Nonton 800+ channel TV Indonesia dan Internasional gratis. Streaming live TV online tanpa buffering. Metro TV, Trans TV, RCTI, CNN, BBC, dan banyak lagi.',
  keywords: ['nonton tv online', 'tv indonesia', 'live streaming', 'tv online gratis', 'nonton tv', 'channel tv indonesia', 'streaming tv', 'tv drop'],
  authors: [{ name: 'Rey Denim Osborn' }],
  creator: 'Rey Denim Osborn',
  publisher: 'TVDROP',
  robots: { index: true, follow: true },
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'TVDROP',
    title: 'TVDROP — Nonton TV Online Indonesia & Internasional',
    description: 'Nonton 800+ channel TV Indonesia dan Internasional gratis. Streaming live TV online tanpa ribet.',
    url: baseUrl,
    images: [{ url: '/logo.png', width: 600, height: 150, alt: 'TVDROP' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TVDROP — Nonton TV Online',
    description: 'Nonton 800+ channel TV Indonesia dan Internasional gratis.',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: { url: '/logo.png' },
  },
  appleWebApp: { title: 'TVDROP', capable: true, statusBarStyle: 'black-translucent' },
  themeColor: '#000000',
  manifest: '/manifest.json',
  other: {
    'google-site-verification': 'pending', // ganti kalo udah verify
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-black text-white">{children}</body>
    </html>
  );
}
