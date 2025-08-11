import { NextRequest, NextResponse } from 'next/server'

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const user = users.find(u => u.id === id)
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  
  return NextResponse.json(user)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const userIndex = users.findIndex(u => u.id === id)
  
  if (userIndex === -1) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  
  const body = await request.json()
  users[userIndex] = { ...users[userIndex], ...body }
  
  return NextResponse.json(users[userIndex])
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id)
  const userIndex = users.findIndex(u => u.id === id)
  
  if (userIndex === -1) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  
  users.splice(userIndex, 1)
  return NextResponse.json({ message: 'User deleted' })
}