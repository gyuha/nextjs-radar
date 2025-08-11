import Link from 'next/link'

export default function BlogPage() {
  const posts = [
    { slug: 'nextjs-13-features', title: 'Next.js 13 New Features' },
    { slug: 'app-router-guide', title: 'Complete App Router Guide' },
    { slug: 'server-components', title: 'Understanding Server Components' }
  ]

  return (
    <div>
      <h1>Blog</h1>
      <p>Welcome to our blog!</p>
      
      <section>
        <h2>Recent Posts</h2>
        <ul>
          {posts.map(post => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`}>
                {post.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}