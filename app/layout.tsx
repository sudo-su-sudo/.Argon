import type { Metadata, Viewport } from 'next';
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700'],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const viewport: Viewport = {
  themeColor: '#090D16',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Axiom-0 Sovereign Mobile & AI Kernel Studio',
  description:
    'First-principles self-modifying AI workbench, custom binary compiler & VM, Git-DAG context engine, compoundable live telemetry matrix, and Android app studio.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Axiom-0',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Axiom-0 Sovereign Mobile & AI Kernel Studio',
    description:
      'First-principles self-modifying AI workbench, custom binary compiler & VM, Git-DAG context engine, compoundable live telemetry matrix, and Android app studio.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Axiom-0 Sovereign Mobile & AI Kernel Studio',
    description:
      'First-principles self-modifying AI workbench, custom binary compiler & VM, Git-DAG context engine, compoundable live telemetry matrix, and Android app studio.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable} ${jetbrains.variable} dark`}
    >
      <body
        suppressHydrationWarning
        className="bg-[#090D16] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200"
      >
        {children}
      </body>
    </html>
  );
}
