interface BlogPostProps {
  params: {
    slug: string
  }
}

export default function BlogPost({ params }: BlogPostProps) {
  const { slug } = params

  // Mock blog content
  const content = {
    'nextjs-13-features': {
      title: 'Next.js 13 New Features',
      content: 'Exploring the new App Router and other exciting features in Next.js 13.'
    },
    'app-router-guide': {
      title: 'Complete App Router Guide',
      content: 'A comprehensive guide to the new App Router in Next.js.'
    },
    'server-components': {
      title: 'Understanding Server Components',
      content: 'Deep dive into React Server Components and how they work in Next.js.'
    }
  }

  const post = content[slug as keyof typeof content] || {
    title: 'Post Not Found',
    content: 'This blog post does not exist.'
  }

  return (
    <article>
      <h1>{post.title}</h1>
      <p>Slug: <code>{slug}</code></p>
      <div>
        <p>{post.content}</p>
      </div>
    </article>
  )
}