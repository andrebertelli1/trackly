import type { School, Route, Kid, Profile } from './supabase'

export const mockSchools: School[] = [
  { id: '1', name: 'Colegio San Martín', city: 'Buenos Aires', state: 'CABA', created_at: '2026-05-01T10:00:00Z' },
  { id: '2', name: 'Instituto Belgrano', city: 'Córdoba', state: 'Córdoba', created_at: '2026-05-02T10:00:00Z' },
  { id: '3', name: 'Escuela Nueva Esperanza', city: 'Rosario', state: 'Santa Fe', created_at: '2026-05-03T10:00:00Z' },
  { id: '4', name: 'Colegio del Sol', city: 'Mendoza', state: 'Mendoza', created_at: '2026-05-04T10:00:00Z' },
  { id: '5', name: 'Liceo Sarmiento', city: 'La Plata', state: 'Buenos Aires', created_at: '2026-05-05T10:00:00Z' },
  { id: '6', name: 'Instituto Patagonia', city: 'Bariloche', state: 'Río Negro', created_at: '2026-05-06T10:00:00Z' },
]

export const mockDrivers: Profile[] = [
  { id: 'd1', full_name: 'Mateo Álvarez', phone: '+54 11 4521 8830', role: 'driver', email: 'mateo.alvarez@trackly.app', since: '2024-08-14' },
  { id: 'd2', full_name: 'Carolina Reyes', phone: '+54 11 6712 9904', role: 'driver', email: 'carolina.r@trackly.app', since: '2024-11-02' },
  { id: 'd3', full_name: 'Lucas Pereyra', phone: '+54 351 442 1180', role: 'driver', email: 'lpereyra@trackly.app', since: '2024-05-20' },
  { id: 'd4', full_name: 'Sofía Domínguez', phone: '+54 341 558 7733', role: 'driver', email: 'sofia.d@trackly.app', since: '2025-01-18', status: 'Inactive' },
  { id: 'd5', full_name: 'Javier Quiroga', phone: '+54 261 477 2245', role: 'driver', email: 'jquiroga@trackly.app', since: '2023-12-09' },
  { id: 'd6', full_name: 'Renata Vidal', phone: '+54 11 5598 1023', role: 'driver', email: 'renata.v@trackly.app', since: '2025-03-04' },
]

export const mockRoutes: Route[] = [
  {
    id: 'r1', school_id: '1', driver_id: 'd1', van_label: 'Van 04', van_color: '#3A5BD9',
    period: 'morning', pickup_start: '06:40', arrival_time: '07:30',
    created_at: '2026-05-10T08:00:00Z',
    schools: { name: 'Colegio San Martín' },
    profiles: { full_name: 'Mateo Álvarez' },
  },
  {
    id: 'r2', school_id: '1', driver_id: 'd1', van_label: 'Van 11', van_color: '#1F8A5B',
    period: 'afternoon', pickup_start: '13:10', arrival_time: '14:05',
    created_at: '2026-05-11T08:00:00Z',
    schools: { name: 'Colegio San Martín' },
    profiles: { full_name: 'Mateo Álvarez' },
  },
  {
    id: 'r3', school_id: '2', driver_id: 'd2', van_label: 'Van 07', van_color: '#F5A524',
    period: 'morning', pickup_start: '06:55', arrival_time: '07:45',
    created_at: '2026-05-12T08:00:00Z',
    schools: { name: 'Instituto Belgrano' },
    profiles: { full_name: 'Carolina Reyes' },
  },
  {
    id: 'r4', school_id: '4', driver_id: 'd3', van_label: 'Van 02', van_color: '#9148C9',
    period: 'morning', pickup_start: '07:00', arrival_time: '07:50',
    created_at: '2026-05-13T08:00:00Z',
    schools: { name: 'Colegio del Sol' },
    profiles: { full_name: 'Lucas Pereyra' },
  },
  {
    id: 'r5', school_id: '4', driver_id: 'd3', van_label: 'Van 09', van_color: '#D04F3C',
    period: 'afternoon', pickup_start: '12:50', arrival_time: '13:40',
    created_at: '2026-05-14T08:00:00Z',
    schools: { name: 'Colegio del Sol' },
    profiles: { full_name: 'Lucas Pereyra' },
  },
  {
    id: 'r6', school_id: '3', driver_id: 'd5', van_label: 'Van 14', van_color: '#0BA5A0',
    period: 'morning', pickup_start: '06:30', arrival_time: '07:20',
    created_at: '2026-05-15T08:00:00Z',
    schools: { name: 'Escuela Nueva Esperanza' },
    profiles: { full_name: 'Javier Quiroga' },
  },
  {
    id: 'r7', school_id: '5', driver_id: 'd6', van_label: 'Van 03', van_color: '#E07A1E',
    period: 'morning', pickup_start: '07:10', arrival_time: '08:00',
    created_at: '2026-05-16T08:00:00Z',
    schools: { name: 'Liceo Sarmiento' },
    profiles: { full_name: 'Renata Vidal' },
  },
  {
    id: 'r8', school_id: '2', driver_id: 'd4', van_label: 'Van 18', van_color: '#5B6BD9',
    period: 'afternoon', pickup_start: '13:20', arrival_time: '14:15',
    created_at: '2026-05-17T08:00:00Z',
    schools: { name: 'Instituto Belgrano' },
    profiles: { full_name: 'Sofía Domínguez' },
  },
]

export const mockKids: Kid[] = [
  {
    id: 'k1', full_name: 'Tomás Herrera', short_name: 'Tomás', grade: 4, color: '#3A5BD9',
    created_at: '2024-03-04T08:00:00Z',
    kid_route_assignments: [{ routes: { van_label: 'Van 04', schools: { name: 'Colegio San Martín' } } }],
    parent_name: 'Andrea Herrera', parent_phone: '+54 11 3320 8801',
  },
  {
    id: 'k2', full_name: 'Valentina Soto', short_name: 'Valen', grade: 2, color: '#1F8A5B',
    created_at: '2024-03-04T08:00:00Z',
    kid_route_assignments: [{ routes: { van_label: 'Van 04', schools: { name: 'Colegio San Martín' } } }],
    parent_name: 'Pablo Soto', parent_phone: '+54 11 5512 7704',
  },
  {
    id: 'k3', full_name: 'Joaquín Méndez', short_name: 'Joaquín', grade: 6, color: '#9148C9',
    created_at: '2024-03-11T08:00:00Z',
    kid_route_assignments: [{ routes: { van_label: 'Van 11', schools: { name: 'Colegio San Martín' } } }],
    parent_name: 'Lucía Méndez', parent_phone: '+54 11 4421 8830',
  },
  {
    id: 'k4', full_name: 'Camila Ruiz', short_name: 'Cami', grade: 3, color: '#F5A524',
    created_at: '2024-04-01T08:00:00Z',
    kid_route_assignments: [{ routes: { van_label: 'Van 07', schools: { name: 'Instituto Belgrano' } } }],
    parent_name: 'Hernán Ruiz', parent_phone: '+54 11 6398 1145',
  },
  {
    id: 'k5', full_name: 'Bautista Núñez', short_name: 'Bautista', grade: 5, color: '#D04F3C',
    created_at: '2024-04-08T08:00:00Z',
    kid_route_assignments: [{ routes: { van_label: 'Van 07', schools: { name: 'Instituto Belgrano' } } }],
    parent_name: 'Florencia Núñez', parent_phone: '+54 351 442 7702',
  },
  {
    id: 'k6', full_name: 'Olivia Romero', short_name: 'Olivia', grade: 1, color: '#0BA5A0',
    created_at: '2025-02-17T08:00:00Z',
    kid_route_assignments: [{ routes: { van_label: 'Van 02', schools: { name: 'Colegio del Sol' } } }],
    parent_name: 'Mariano Romero', parent_phone: '+54 261 459 3320',
  },
  {
    id: 'k7', full_name: 'Benicio Castro', short_name: 'Benicio', grade: 4, color: '#E07A1E',
    created_at: '2025-02-17T08:00:00Z',
    kid_route_assignments: [{ routes: { van_label: 'Van 02', schools: { name: 'Colegio del Sol' } } }],
    parent_name: 'Belén Castro', parent_phone: '+54 261 487 5512',
  },
  {
    id: 'k8', full_name: 'Isabella Vargas', short_name: 'Isa', grade: 2, color: '#5B6BD9',
    created_at: '2025-03-03T08:00:00Z',
    kid_route_assignments: [{ routes: { van_label: 'Van 09', schools: { name: 'Colegio del Sol' } } }],
    parent_name: 'Damián Vargas', parent_phone: '+54 261 412 9908',
  },
]

export const mockInviteCodes = [
  {
    code: 'SANMRT-04A', route_id: 'r1', route_label: 'Van 04 · Morning',
    expires_at: '2026-11-08T00:00:00Z', max_redemptions: 15,
    created_at: '2026-09-08T08:00:00Z',
    kids: { full_name: 'Van 04 · Morning' }, redemption_count: 5, status: 'Active',
  },
  {
    code: 'BELGRN-07M', route_id: 'r3', route_label: 'Van 07 · Morning',
    expires_at: '2026-12-12T00:00:00Z', max_redemptions: 12,
    created_at: '2026-09-12T08:00:00Z',
    kids: { full_name: 'Van 07 · Morning' }, redemption_count: 8, status: 'Active',
  },
  {
    code: 'SOL-02M', route_id: 'r4', route_label: 'Van 02 · Morning',
    expires_at: '2026-10-21T00:00:00Z', max_redemptions: 10,
    created_at: '2026-09-21T08:00:00Z',
    kids: { full_name: 'Van 02 · Morning' }, redemption_count: 10, status: 'Exhausted',
  },
  {
    code: 'SARM-03M', route_id: 'r7', route_label: 'Van 03 · Morning',
    expires_at: '2025-10-04T00:00:00Z', max_redemptions: 10,
    created_at: '2025-08-04T08:00:00Z',
    kids: { full_name: 'Van 03 · Morning' }, redemption_count: 4, status: 'Expired',
  },
]

export const mockActivity = [
  { id: 'a1', kind: 'student', text: 'Olivia Romero registered on Van 02 · Morning', ago: '12 min' },
  { id: 'a2', kind: 'code',    text: 'SANMRT-04A redeemed by Tomás Herrera', ago: '38 min' },
  { id: 'a3', kind: 'route',   text: 'Van 14 · Morning created at Escuela Nueva Esperanza', ago: '2 h' },
  { id: 'a4', kind: 'driver',  text: 'Renata Vidal assigned to Van 03 · Morning', ago: '5 h' },
  { id: 'a5', kind: 'code',    text: 'BELGRN-07M created · 12 uses · expires Dec 12', ago: 'yesterday' },
]

export const mockPromotionCandidates = [
  { id: 'u101', full_name: 'Diego Funes', email: 'diego.funes@gmail.com', phone: '+54 11 3340 7788', since: '2025-09-12', role: 'parent' as const },
  { id: 'u102', full_name: 'Marina Costa', email: 'marina.costa@hotmail.com', phone: '+54 11 4187 2231', since: '2025-10-01', role: 'parent' as const },
]
