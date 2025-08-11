export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="marketing-banner">
        <p>🎉 Special promotion - 50% off this month!</p>
      </div>
      {children}
    </div>
  )
}