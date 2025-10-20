import './globals.css'
import type { Metadata } from 'next'
import { Anton } from 'next/font/google'

const anton = Anton({
  subsets: ['latin'],
  weight: '400'
})

export const metadata: Metadata = {
  title: 'Skate Customizer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={anton.className}>
      <body className="bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
