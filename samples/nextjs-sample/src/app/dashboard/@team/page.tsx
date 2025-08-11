export default function TeamPanel() {
  const teamMembers = [
    { name: 'Alice Johnson', role: 'Frontend Dev', status: 'online' },
    { name: 'Bob Smith', role: 'Backend Dev', status: 'away' },
    { name: 'Carol Brown', role: 'Designer', status: 'offline' }
  ]

  return (
    <div>
      <h3>👥 Team</h3>
      <ul>
        {teamMembers.map((member, index) => (
          <li key={index} className={`member member-${member.status}`}>
            <strong>{member.name}</strong>
            <br />
            <small>{member.role}</small>
          </li>
        ))}
      </ul>
    </div>
  )
}