import { Inter } from 'next/font/google'
import './globals.css'
import Provider from './provider'
import { Toaster } from 'sonner'

// Load a clean, readable font once and reuse it in the whole app.
const inter = Inter({ subsets: ['latin'] })

// Root layout wraps every page so shared providers and UI are always available.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Global app providers live here so every page can access them. */}
        <Provider>
           {children}
        </Provider>
        {/* Toast notifications mount once for the entire app. */}
        <Toaster/>
      </body>
    </html>
  )
}