import { supabase } from './supabase';
import type { Tienda, Usuario, Articulo, Registro, SobranteSinStock, TiendaStats, GrupoComercial, GrupoStats } from '../types';

// ─── GRUPOS COMERCIALES ───────────────────────────────────────────────────────

export async function dbGetGrupos(): Promise<GrupoComercial[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('grupos_comerciales') as any)
    .select('*')
    .order('creado_en');
  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(r => ({
    id:          r.id,
    nombre:      r.nombre,
    color:       r.color ?? '#6366F1',
    descripcion: r.descripcion ?? undefined,
    creadoEn:    r.creado_en,
  }));
}

export async function dbCreateGrupo(
  g: Pick<GrupoComercial, 'nombre' | 'color' | 'descripcion'>
): Promise<{ id: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('grupos_comerciales') as any)
    .insert({ nombre: g.nombre, color: g.color, descripcion: g.descripcion ?? null })
    .select('id')
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function dbUpdateGrupo(
  id: string,
  g: Partial<Pick<GrupoComercial, 'nombre' | 'color' | 'descripcion'>>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('grupos_comerciales') as any)
    .update({ nombre: g.nombre, color: g.color, descripcion: g.descripcion ?? null })
    .eq('id', id);
}

export async function dbDeleteGrupo(id: string): Promise<void> {
  // Unlink tiendas before deleting so they are not left orphaned
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('tiendas') as any).update({ grupo_id: null }).eq('grupo_id', id);
  await supabase.from('grupos_comerciales').delete().eq('id', id);
}

// Asigna (o desvincula) una tienda a un grupo
export async function dbAsignarTiendaAGrupo(
  tiendaId: string,
  grupoId: string | null,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('tiendas') as any)
    .update({ grupo_id: grupoId })
    .eq('id', tiendaId);
}

// ─── TIENDAS ──────────────────────────────────────────────────────────────────

export async function dbGetTiendas(): Promise<Tienda[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('tiendas') as any)
    .select('*')
    .order('creado_en');
  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(r => ({
    id:             r.id,
    nombre:         r.nombre,
    icono:          r.icono    ?? 'storefront',
    color:          r.color    ?? '#09090B',
    nit:            r.nit      ?? undefined,
    grupoId:        r.grupo_id ?? undefined,
    modoInventario: r.modo_inventario ?? undefined,
    cerradoPor:     r.cerrado_por     ?? undefined,
  }));
}

export async function dbUpsertTienda(
  t: Tienda,
  modoInventario?: 'ONLINE' | 'OFFLINE',
): Promise<void> {
  if (modoInventario !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('tiendas') as any).upsert(
      { id: t.id, nombre: t.nombre, icono: t.icono, color: t.color, nit: t.nit ?? null,
        grupo_id: t.grupoId ?? null, modo_inventario: modoInventario },
      { onConflict: 'id' },
    );
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('tiendas') as any).upsert(
      { id: t.id, nombre: t.nombre, icono: t.icono, color: t.color, nit: t.nit ?? null,
        grupo_id: t.grupoId ?? null },
      { onConflict: 'id' },
    );
  }
}

export async function dbDeleteTienda(id: string): Promise<void> {
  // Cascade delete: remove child records before the tienda itself
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await Promise.all([
    (supabase.from('registros') as any).delete().eq('tienda_id', id),
    (supabase.from('sobrantes') as any).delete().eq('tienda_id', id),
    (supabase.from('catalogos') as any).delete().eq('tienda_id', id),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('tiendas') as any).delete().eq('id', id);
}

export async function dbSetModoInventario(
  id: string,
  modo: 'ONLINE' | 'OFFLINE',
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('tiendas') as any).update({ modo_inventario: modo }).eq('id', id);
}

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

function migrateRol(rol: string): Usuario['rol'] {
  if (rol === 'AUDITOR') return 'ADMIN';
  return rol as Usuario['rol'];
}

export async function dbGetUsuarios(): Promise<Omit<Usuario, 'passWeb'>[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('usuarios') as any)
    .select('id,cedula,nombre,rol,tiendas,tiendas_roles,grupos,telefono,activo,creado_por');
  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(r => ({
    id:           r.id,
    cedula:       r.cedula,
    nombre:       r.nombre,
    rol:          migrateRol(r.rol),
    tiendas:      r.tiendas       ?? [],
    tiendasRoles: r.tiendas_roles ?? {},
    grupos:       r.grupos        ?? [],
    telefono:     r.telefono      ?? undefined,
    activo:       r.activo        ?? true,
    creadoPor:    r.creado_por    ?? undefined,
  }));
}

export async function dbGetUsuarioByCedula(cedula: string): Promise<Usuario | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('usuarios') as any)
    .select('id,cedula,nombre,rol,tiendas,tiendas_roles,grupos,telefono,activo,creado_por,pass_web')
    .eq('cedula', cedula)
    .single();
  if (error || !data) return null;
  return {
    id:           data.id,
    cedula:       data.cedula,
    nombre:       data.nombre,
    rol:          migrateRol(data.rol),
    tiendas:      data.tiendas       ?? [],
    tiendasRoles: data.tiendas_roles ?? {},
    grupos:       data.grupos        ?? [],
    telefono:     data.telefono      ?? undefined,
    activo:       data.activo        ?? true,
    creadoPor:    data.creado_por    ?? undefined,
    passWeb:      data.pass_web      ?? null,
  };
}

export async function dbSetPassWeb(userId: string, passHash: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('usuarios') as any).update({ pass_web: passHash }).eq('id', userId);
}

export async function dbUpsertUsuario(u: Omit<Usuario, 'passWeb'>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('usuarios') as any).upsert(
    {
      id:            u.id,
      cedula:        u.cedula,
      nombre:        u.nombre,
      rol:           u.rol,
      tiendas:       u.tiendas,
      tiendas_roles: u.tiendasRoles ?? {},
      grupos:        u.grupos       ?? [],
      telefono:      u.telefono ?? null,
      activo:        u.activo ?? true,
      creado_por:    u.creadoPor ?? null,
    },
    { onConflict: 'id' },
  );
}

export async function dbDeleteUsuario(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('usuarios') as any).delete().eq('id', id);
}

// ─── REGISTROS ────────────────────────────────────────────────────────────────

export async function dbGetRegistros(tiendaId?: string): Promise<Registro[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('registros') as any)
    .select('*')
    .order('escaneado_en', { ascending: false });
  if (tiendaId) query = query.eq('tienda_id', tiendaId);
  const { data, error } = await query;
  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(r => ({
    id:            r.id,
    tiendaId:      r.tienda_id,
    itemId:        r.item_id,
    descripcion:   r.descripcion,
    ubicacion:     r.ubicacion,
    stockSistema:  r.stock_sistema,
    costoUnitario: r.costo_unitario,
    cantidad:      r.cantidad,
    nota:          r.nota          ?? '',
    fotoUri:       r.foto_uri      ?? null,
    usuarioNombre: r.usuario_nombre,
    escaneadoEn:   r.escaneado_en,
    clasificacion: r.clasificacion,
  }));
}

export async function dbDeleteRegistro(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('registros') as any).delete().eq('id', id);
}

export async function dbLimpiarRegistrosTienda(tiendaId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('registros') as any).delete().eq('tienda_id', tiendaId);
}

// ─── CATÁLOGOS ────────────────────────────────────────────────────────────────

export async function dbGetCatalogo(tiendaId: string): Promise<Articulo[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from('catalogos') as any)
    .select('*')
    .eq('tienda_id', tiendaId);
  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(r => ({
    itemId:      r.item_id,
    descripcion: r.descripcion,
    ubicacion:   r.ubicacion,
    stock:       r.stock,
    costo:       r.costo,
  }));
}

export async function dbUpsertCatalogo(tiendaId: string, articulos: Articulo[]): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('catalogos') as any).delete().eq('tienda_id', tiendaId);
  if (!articulos.length) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('catalogos') as any).insert(
    articulos.map(a => ({
      tienda_id:   tiendaId,
      item_id:     a.itemId,
      descripcion: a.descripcion,
      ubicacion:   a.ubicacion,
      stock:       a.stock,
      costo:       a.costo,
    })),
  );
}

// ─── SOBRANTES ────────────────────────────────────────────────────────────────

export async function dbConfirmarSobrante(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('sobrantes') as any).update({ estado: 'CONFIRMADO' }).eq('id', id);
}

export async function dbDeleteSobrante(id: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('sobrantes') as any).delete().eq('id', id);
}

export async function dbGetSobrantes(tiendaId?: string): Promise<SobranteSinStock[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from('sobrantes') as any)
    .select('*')
    .order('creado_en', { ascending: false });
  if (tiendaId) query = query.eq('tienda_id', tiendaId);
  const { data, error } = await query;
  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map(r => ({
    id:            r.id,
    tiendaId:      r.tienda_id,
    codigo:        r.codigo,
    descripcion:   r.descripcion,
    ubicacion:     r.ubicacion,
    fotoUri:       r.foto_uri      ?? '',
    estado:        r.estado,
    precio:        r.precio,
    cantidad:      r.cantidad,
    usuarioNombre: r.usuario_nombre,
    registradoEn:  r.registrado_en,
  }));
}

// ─── ESTADÍSTICAS por GRUPO (calculadas) ─────────────────────────────────────

export async function dbGetGruposConStats(
  grupoIds?: string[], // si se pasa, filtra solo esos grupos
): Promise<GrupoStats[]> {
  const [grupos, allStats] = await Promise.all([
    dbGetGrupos(),
    dbGetTiendasConStats(),
  ]);

  const gruposFiltrados = grupoIds
    ? grupos.filter(g => grupoIds.includes(g.id))
    : grupos;

  return gruposFiltrados.map(grupo => {
    const tiendaStats = allStats.filter(s => s.tienda.grupoId === grupo.id);
    const tiendasActivas = tiendaStats.filter(s => s.tienda.modoInventario !== 'OFFLINE').length;
    const progresoGlobal = tiendaStats.length
      ? Math.round(tiendaStats.reduce((a, s) => a + s.progreso, 0) / tiendaStats.length)
      : 0;
    return {
      grupo,
      totalTiendas:   tiendaStats.length,
      tiendasActivas,
      progresoGlobal,
      valorFaltante:  tiendaStats.reduce((a, s) => a + s.valorFaltante, 0),
      valorSobrante:  tiendaStats.reduce((a, s) => a + s.valorSobrante, 0),
    };
  });
}

// ─── ESTADÍSTICAS (calculadas) ────────────────────────────────────────────────

export async function dbGetTiendasConStats(): Promise<TiendaStats[]> {
  const [tiendas, registros, catalogosRaw] = await Promise.all([
    dbGetTiendas(),
    dbGetRegistros(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('catalogos') as any).select('tienda_id'),
  ]);

  const catalogoCount: Record<string, number> = {};
  if (catalogosRaw.data) {
    for (const r of catalogosRaw.data) {
      catalogoCount[r.tienda_id] = (catalogoCount[r.tienda_id] ?? 0) + 1;
    }
  }

  // Build a Map for O(1) lookup instead of O(n) filter per tienda
  const registrosByTienda = new Map<string, typeof registros>();
  for (const r of registros) {
    const list = registrosByTienda.get(r.tiendaId) ?? [];
    list.push(r);
    registrosByTienda.set(r.tiendaId, list);
  }

  return tiendas.map(tienda => {
    const regs = registrosByTienda.get(tienda.id) ?? [];
    const total = catalogoCount[tienda.id] ?? 0;

    const faltantes    = regs.filter(r => r.clasificacion === 'FALTANTE');
    const sobrantes    = regs.filter(r => r.clasificacion === 'SOBRANTE');
    const sinDiferencia = regs.filter(r => r.clasificacion === 'SIN_DIF').length;
    const ceros        = regs.filter(r => r.clasificacion === 'CERO').length;

    const valorFaltante = faltantes.reduce(
      (acc, r) => acc + Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario, 0
    );
    const valorSobrante = sobrantes.reduce(
      (acc, r) => acc + Math.abs(r.cantidad - r.stockSistema) * r.costoUnitario, 0
    );

    return {
      tienda,
      totalCatalogo:  total,
      totalRegistros: regs.length,
      progreso:       total > 0 ? Math.round((regs.length / total) * 100) : 0,
      valorFaltante,
      valorSobrante,
      faltantes:      faltantes.length,
      sobrantes:      sobrantes.length,
      sinDiferencia,
      ceros,
    };
  });
}

// ─── NOTIFICACIONES ───────────────────────────────────────────────────────────

export interface Notification {
  id:         string;
  userId:     string;
  type:       'store_assigned' | 'store_removed' | 'inventory_opened' | 'inventory_closed' | 'inventory_complete' | 'group_assigned';
  title:      string;
  body:       string | null;
  metadata:   Record<string, string>;
  read:       boolean;
  createdAt:  string;
}

export async function dbGetNotifications(cedula: string, limit = 25): Promise<Notification[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('notifications')
    .select('*')
    .eq('user_id', cedula)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((r: any) => ({
    id:        r.id,
    userId:    r.user_id,
    type:      r.type,
    title:     r.title,
    body:      r.body ?? null,
    metadata:  r.metadata ?? {},
    read:      r.read,
    createdAt: r.created_at,
  }));
}

export async function dbMarkNotificationsRead(ids: string[]): Promise<void> {
  if (!ids.length) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('notifications')
    .update({ read: true })
    .in('id', ids);
}

export async function dbMarkAllNotificationsRead(cedula: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('notifications')
    .update({ read: true })
    .eq('user_id', cedula)
    .eq('read', false);
}
