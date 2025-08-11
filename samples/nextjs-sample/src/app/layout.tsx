import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Next.js Radar Sample',
  description: 'Sample Next.js App Router project for testing Next.js Radar extension',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>
            <h1>Next.js Radar Sample</h1>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>&copy; 2024 Next.js Radar Sample</p>
        </footer>
      </body>
    </html>
  )
}