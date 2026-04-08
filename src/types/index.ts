// ─── Tipos compartidos con la app móvil ───────────────────────────────────────
// Estos tipos deben mantenerse sincronizados con:
// stockiq/src/constants/data.ts

export type Rol = 'SUPERADMIN' | 'ADMIN' | 'CONTADOR';
export type Clasificacion = 'SIN_DIF' | 'FALTANTE' | 'SOBRANTE' | 'CERO';
export type EstadoSobrante = 'CONFIRMADO' | 'PENDIENTE';

export interface Usuario {
  id: string;
  cedula: string;
  nombre: string;
  rol: Rol;
  tiendas: string[];
  tiendasRoles: Record<string, 'ADMIN' | 'CONTADOR'>;
  telefono?: string;
  activo?: boolean;
  creadoPor?: string;
  passWeb?: string | null;  // hash SHA-256 de la contraseña web (exclusivo web)
}

export interface Tienda {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  nit?: string;
  modoInventario?: 'ONLINE' | 'OFFLINE';
  cerradoPor?: string;
}

export interface Articulo {
  itemId: string;
  descripcion: string;
  ubicacion: string;
  stock: number;
  costo: number;
}

export interface Registro {
  id: string;
  tiendaId: string;
  itemId: string;
  descripcion: string;
  ubicacion: string;
  stockSistema: number;
  costoUnitario: number;
  cantidad: number;
  nota: string;
  fotoUri: string | null;
  usuarioNombre: string;
  escaneadoEn: string;
  clasificacion: Clasificacion;
}

export interface SobranteSinStock {
  id: string;
  tiendaId: string;
  codigo: string;
  descripcion: string;
  ubicacion: string;
  fotoUri: string;
  estado: EstadoSobrante;
  precio: number;
  cantidad: number;
  usuarioNombre: string;
  registradoEn: string;
}

// ─── Tipos de sesión web ───────────────────────────────────────────────────────
export interface SessionUser {
  id: string;
  cedula: string;
  nombre: string;
  rol: Rol;
  tiendas: string[];
  tiendasRoles: Record<string, 'ADMIN' | 'CONTADOR'>;
}

// ─── Estadísticas de tienda (calculadas) ──────────────────────────────────────
export interface TiendaStats {
  tienda: Tienda;
  totalCatalogo: number;
  totalRegistros: number;
  progreso: number;          // 0-100
  valorFaltante: number;
  valorSobrante: number;
  faltantes: number;
  sobrantes: number;
  sinDiferencia: number;
  ceros: number;
}
