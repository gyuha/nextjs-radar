interface DocsProps {
  params: {
    slug: string[]
  }
}

export default function DocsPage({ params }: DocsProps) {
  const { slug } = params
  const path = slug?.join('/') || ''

  return (
    <div>
      <h1>Documentation</h1>
      <p>Current path: <code>/{path}</code></p>
      <p>Segments: {JSON.stringify(slug)}</p>
      
      <section>
        <h2>Catch-all Route Example</h2>
        <p>This route matches:</p>
        <ul>
          <li>/docs/getting-started</li>
          <li>/docs/api/authentication</li>
          <li>/docs/guides/deployment/vercel</li>
          <li>And any other path under /docs/...</li>
        </ul>
      </section>
    </div>
  )
}