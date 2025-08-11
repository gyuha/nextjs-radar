export default function DashboardPage() {
  return (
    <div>
      <h2>Main Dashboard</h2>
      <p>Welcome to your dashboard! This demonstrates parallel routes.</p>
      
      <div className="metrics">
        <div className="metric">
          <h3>Total Users</h3>
          <p>1,234</p>
        </div>
        <div className="metric">
          <h3>Revenue</h3>
          <p>$12,345</p>
        </div>
        <div className="metric">
          <h3>Growth</h3>
          <p>+15%</p>
        </div>
      </div>
    </div>
  )
}