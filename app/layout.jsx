import { Inter, Poppins } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/lib/toast-context'
import { ToastContainerWrapper } from '@/components/ToastContainerWrapper'

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata = {
  title: 'NexFlow Dashboard',
  description: 'Modern KPI Dashboard for Financial Monitoring',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
          <ToastContainerWrapper />
        </ToastProvider>
      </body>
    </html>
  )
}
