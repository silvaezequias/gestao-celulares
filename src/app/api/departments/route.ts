import { NextResponse } from 'next/server';
import { createDepartment, getAppData, invalidate } from '../../../lib/server/repo';

export async function GET() {
  const { departments } = await getAppData();
  return NextResponse.json(departments);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  }
  const department = await createDepartment(trimmed);
  invalidate();
  return NextResponse.json(department);
}
