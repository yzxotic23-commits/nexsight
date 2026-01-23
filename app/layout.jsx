import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/lib/toast-context'
import { ToastContainerWrapper } from '@/components/ToastContainerWrapper'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import ThemeProviderWrapper from '@/components/ThemeProviderWrapper'

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata = {
  title: 'NexSight Dashboard',
  description: 'Modern KPI Dashboard for Financial Monitoring',
  icons: {
    icon: [
      { url: '/logo/eyes.png', type: 'image/png' },
      { url: '/logo/eyes.png', type: 'image/png', sizes: '32x32' },
      { url: '/logo/eyes.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/logo/eyes.png',
    apple: '/logo/eyes.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo/eyes.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/logo/eyes.png" />
        <meta name="theme-color" content="#DEC05F" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const themeData = localStorage.getItem('nexsight-theme');
                  if (themeData) {
                    const parsed = JSON.parse(themeData);
                    const savedTheme = parsed?.state?.theme || parsed?.theme || 'dark';
                    if (savedTheme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ThemeProviderWrapper>
          <SessionProviderWrapper>
            <ToastProvider>
              {children}
              <ToastContainerWrapper />
            </ToastProvider>
          </SessionProviderWrapper>
        </ThemeProviderWrapper>
      </body>
    </html>
  )
}
