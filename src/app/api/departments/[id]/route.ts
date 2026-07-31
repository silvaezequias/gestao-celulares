import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  await prisma.department.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
