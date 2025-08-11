export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
      </div>
      
      <div className="dashboard-content">
        <main className="dashboard-main">
          {children}
        </main>
        
        <aside className="dashboard-sidebar">
          <section className="analytics-panel">
            {analytics}
          </section>
          
          <section className="team-panel">
            {team}
          </section>
        </aside>
      </div>
    </div>
  )
}