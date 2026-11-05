import { NextResponse } from 'next/server';
import { deletePhone, invalidate, updatePhone } from '../../../../lib/server/repo';
import { PhoneDraft } from '../../../../lib/phones/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const draft: PhoneDraft = await request.json();
  const phone = await updatePhone(id, draft);
  invalidate();
  return NextResponse.json(phone);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  await deletePhone(id);
  invalidate();
  return NextResponse.json({ ok: true });
}
