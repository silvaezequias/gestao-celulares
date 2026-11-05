import { NextResponse } from 'next/server';
import { createPhone, getAppData, invalidate } from '../../../lib/server/repo';
import { PhoneDraft } from '../../../lib/phones/types';

export async function GET() {
  const { phones } = await getAppData();
  return NextResponse.json(phones);
}

export async function POST(request: Request) {
  const draft: PhoneDraft = await request.json();
  const phone = await createPhone(draft);
  invalidate();
  return NextResponse.json(phone);
}
