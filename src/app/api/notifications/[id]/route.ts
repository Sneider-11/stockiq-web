import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbMarkNotificationsRead } from '@/lib/db';

// PATCH /api/notifications/[id] — marca una notificación individual como leída
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  await dbMarkNotificationsRead([id]);
  return NextResponse.json({ ok: true });
}
