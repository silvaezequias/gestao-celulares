import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  const departments = await prisma.department.findMany();
  return NextResponse.json(departments);
}

export async function POST(request: Request) {
  const { name } = await request.json();
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  }

  const existing = await prisma.department.findFirst({
    where: { name: { equals: trimmed, mode: 'insensitive' } },
  });
  if (existing) {
    return NextResponse.json(existing);
  }

  const department = await prisma.department.create({ data: { name: trimmed } });
  return NextResponse.json(department);
}
