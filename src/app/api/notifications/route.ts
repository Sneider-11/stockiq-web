import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { dbGetNotifications, dbMarkAllNotificationsRead } from '@/lib/db';

// GET /api/notifications — trae las últimas notificaciones del usuario en sesión
export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const notifications = await dbGetNotifications(user.cedula);
  return NextResponse.json(notifications);
}

// PATCH /api/notifications — marca todas como leídas
export async function PATCH() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  await dbMarkAllNotificationsRead(user.cedula);
  return NextResponse.json({ ok: true });
}
