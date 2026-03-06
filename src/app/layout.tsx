// @ts-nocheck
import type { Metadata } from "next";
import { Arimo } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

const arimo = Arimo({
  variable: "--font-arimo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Gotrade",
  description: "Indian's first AI-powered trading platform",
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: "Gotrade",
    description: "Indian's first AI-powered trading platform",
    url: 'https://gotrade.co.in',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var k='theme';var s=localStorage.getItem(k);var mq=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');var prefersDark=mq?mq.matches:false;var t=s|| (prefersDark?'dark':'light');var d=document.documentElement;function applyTheme(v){d.setAttribute('data-theme',v);if(v==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}}applyTheme(t);if(!s&&mq){var onChange=function(e){applyTheme(e.matches?'dark':'light')};if(mq.addEventListener){mq.addEventListener('change',onChange);}else if(mq.addListener){mq.addListener(onChange);}}}catch(e){}})();",
          }}
        />
      </head>
      <body
        className={`${arimo.variable} font-arimo antialiased`}
        suppressHydrationWarning
      >
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
