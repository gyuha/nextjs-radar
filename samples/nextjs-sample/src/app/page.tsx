import Link from 'next/link'

export default function HomePage() {
  const features = [
    'Static Routes',
    'Dynamic Routes',
    'Catch-all Routes',
    'Route Groups',
    'Parallel Routes',
    'Intercepting Routes'
  ]

  return (
    <div>
      <h1>Welcome to Next.js Radar Sample</h1>
      <p>This sample project demonstrates various Next.js App Router patterns:</p>
      
      <section>
        <h2>Features</h2>
        <ul>
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Navigation</h2>
        <nav>
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/products">Products</Link></li>
            <li><Link href="/dashboard">Dashboard</Link></li>
          </ul>
        </nav>
      </section>
    </div>
  )
}