import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { PhoneDraft } from '../../../lib/phones/types';

export async function GET() {
  const phones = await prisma.phone.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(phones);
}

export async function POST(request: Request) {
  const draft: PhoneDraft = await request.json();
  const phone = await prisma.phone.create({
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
