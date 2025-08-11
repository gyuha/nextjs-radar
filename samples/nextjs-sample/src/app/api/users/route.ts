import { NextRequest, NextResponse } from 'next/server'

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
]

export async function GET() {
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const newUser = {
    id: users.length + 1,
    name: body.name,
    email: body.email
  }
  users.push(newUser)
  
  return NextResponse.json(newUser, { status: 201 })
}