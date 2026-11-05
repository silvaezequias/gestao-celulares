import { NextResponse } from 'next/server';
import { deleteNumber, invalidate, updateNumber } from '../../../../lib/server/repo';
import { NumberRecordDraft } from '../../../../lib/phones/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const draft: NumberRecordDraft = await request.json();
  const rec = await updateNumber(id, draft);
  invalidate();
  return NextResponse.json(rec);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  await deleteNumber(id);
  invalidate();
  return NextResponse.json({ ok: true });
}
