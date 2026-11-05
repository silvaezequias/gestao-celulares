import { NextResponse } from 'next/server';
import { createNumber, getAppData, invalidate } from '../../../lib/server/repo';
import { NumberRecordDraft } from '../../../lib/phones/types';

export async function GET() {
  const { numbers } = await getAppData();
  return NextResponse.json(numbers);
}

export async function POST(request: Request) {
  const draft: NumberRecordDraft = await request.json();
  if (!draft.number?.replace(/\D/g, '')) {
    return NextResponse.json({ error: 'Número obrigatório' }, { status: 400 });
  }
  const { numbers } = await getAppData();
  const digits = draft.number.replace(/\D/g, '');
  if (numbers.some((n) => n.number === digits)) {
    return NextResponse.json({ error: 'Esse número já está cadastrado' }, { status: 409 });
  }
  const rec = await createNumber(draft);
  invalidate();
  return NextResponse.json(rec);
}
