import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { PhoneDraft } from '../../../../lib/phones/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const draft: PhoneDraft = await request.json();
  const phone = await prisma.phone.update({
    where: { id },
    data: {
      name: draft.name,
      model: draft.model,
      chips: draft.chips,
      extraNumbers: draft.extraNumbers,
      whatsapp: draft.whatsapp,
      caseColor: draft.caseColor,
      departmentId: draft.departmentId,
    },
  });
  return NextResponse.json(phone);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  await prisma.phone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
