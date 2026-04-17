// ─── Tipos compartidos con la app móvil ───────────────────────────────────────
// Estos tipos deben mantenerse sincronizados con:
// stockiq/src/constants/data.ts

export type Rol = 'SUPERADMIN' | 'ADMIN' | 'CONTADOR';

// ─── Grupos Comerciales ───────────────────────────────────────────────────────
export interface GrupoComercial {
  id:          string;
  nombre:      string;
  color:       string;
  descripcion?: string;
  creadoEn:    string;
}
export type Clasificacion = 'SIN_DIF' | 'FALTANTE' | 'SOBRANTE' | 'CERO';
export type EstadoSobrante = 'CONFIRMADO' | 'PENDIENTE';

export interface Usuario {
  id: string;
  cedula: string;
  nombre: string;
  rol: Rol;
  tiendas: string[];
  tiendasRoles: Record<string, 'ADMIN' | 'CONTADOR'>;
  grupos: string[];          // IDs de GrupoComercial asignados
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
  grupoId?: string;          // ID del GrupoComercial al que pertenece
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
  grupos: string[];          // IDs de GrupoComercial asignados
}

// ─── Stats de grupo comercial (calculadas) ────────────────────────────────────
export interface GrupoStats {
  grupo:          GrupoComercial;
  totalTiendas:   number;
  tiendasActivas: number;
  progresoGlobal: number;    // promedio de progreso de sus tiendas
  valorFaltante:  number;
  valorSobrante:  number;
}

// ─── Historial de auditorías ──────────────────────────────────────────────────
export interface AuditoriaSnapshot {
  id:             string;
  tiendaId:       string;
  tiendaNombre:   string;
  cerradoPor:     string | null;
  cerradoEn:      string;
  totalCatalogo:  number;
  totalRegistros: number;
  progreso:       number;
  valorFaltante:  number;
  valorSobrante:  number;
  faltantes:      number;
  sobrantesReg:   number;
  sinDiferencia:  number;
  ceros:          number;
  nivelRiesgo:    'BAJO' | 'MEDIO' | 'ALTO';
  registros:      Registro[];
  sobrantes:      SobranteSinStock[];
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
