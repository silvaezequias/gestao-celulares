import { NextResponse } from 'next/server';
import { deleteDepartment, invalidate, renameDepartment } from '../../../../lib/server/repo';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { name } = await request.json();
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
  }
  const department = await renameDepartment(id, trimmed);
  invalidate();
  return NextResponse.json(department);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  await deleteDepartment(id);
  invalidate();
  return NextResponse.json({ ok: true });
}
