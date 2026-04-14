import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbMarkNotificationsRead, dbGetNotifications } from '@/lib/db';

// PATCH /api/notifications/[id] — marca una notificación individual como leída
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { id } = await params;

  // Verify notification belongs to the current user before marking it read
  const notifications = await dbGetNotifications(user.cedula, 100);
  const owned = notifications.some(n => n.id === id);
  if (!owned) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  await dbMarkNotificationsRead([id]);
  return NextResponse.json({ ok: true });
}
