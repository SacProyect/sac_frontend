import type {
  ControlIngreso,
  ControlIngresoTemplate,
  ControlIngresoAssignee,
  ControlIngresoDocument,
  ControlIngresoAuditLog,
  ControlesIngresoStats,
} from '@/types/controles-ingreso';

// ── Controles de Ingreso (15) ─────────────────────────────────────────────────
// Distribución: 3 borradores, 2 en_revision, 4 emitidos, 3 notificados, 2 cerrados, 1 reemitido
export const controlesIngresoMock: ControlIngreso[] = [
  // ── Borradores (3) ──
  {
    id: 'ci_001',
    number: 'CI-2026-001',
    coordination_id: 'COORDINACION_1',
    taxpayer_id: 'tp_001',
    template_id: 'tpl_001',
    subject_name: 'Comercializadora Los Andes, C.A.',
    subject_rif: 'J-40.891.234-5',
    subject_address: 'Av. Libertador, Edif. Las Palmas, Piso 3, Local 3-A',
    subject_parish_id: 'El Recreo',
    issue_date: null,
    start_date: '2026-01-10',
    end_date: null,
    status: 'borrador',
    notes: 'Pendiente de revisión de documentación soporte.',
    created_by: 'admin',
    created_at: '2026-01-10T08:30:00',
    updated_at: '2026-01-10T08:30:00',
  },
  {
    id: 'ci_002',
    number: 'CI-2026-002',
    coordination_id: 'COORDINACION_2',
    taxpayer_id: 'tp_002',
    template_id: 'tpl_002',
    subject_name: 'Distribuidora El Sol, S.R.L.',
    subject_rif: 'J-41.234.567-8',
    subject_address: 'Calle Principal, Centro Comercial El Sol, Local 12',
    subject_parish_id: 'La Candelaria',
    issue_date: null,
    start_date: '2026-01-15',
    end_date: null,
    status: 'borrador',
    notes: null,
    created_by: 'admin',
    created_at: '2026-01-15T09:00:00',
    updated_at: '2026-01-15T09:00:00',
  },
  {
    id: 'ci_003',
    number: 'CI-2026-003',
    coordination_id: 'COORDINACION_3',
    taxpayer_id: 'tp_003',
    template_id: 'tpl_003',
    subject_name: 'Ferretería La Esquina, C.A.',
    subject_rif: 'J-40.567.890-1',
    subject_address: 'Av. Urdaneta, Edif. Ferrer, Planta Baja',
    subject_parish_id: 'San Juan',
    issue_date: null,
    start_date: '2026-01-20',
    end_date: null,
    status: 'borrador',
    notes: 'Esperando confirmación de dirección del contribuyente.',
    created_by: 'fiscal_01',
    created_at: '2026-01-20T10:15:00',
    updated_at: '2026-01-20T10:15:00',
  },
  // ── En Revisión (2) ──
  {
    id: 'ci_004',
    number: 'CI-2026-004',
    coordination_id: 'COORDINACION_4',
    taxpayer_id: 'tp_004',
    template_id: 'tpl_001',
    subject_name: 'Super Mercado Central, C.A.',
    subject_rif: 'J-40.123.456-7',
    subject_address: 'Av. Principal, Edif. Comercial, Local 5',
    subject_parish_id: 'La Vega',
    issue_date: null,
    start_date: '2026-02-01',
    end_date: null,
    status: 'en_revision',
    notes: 'Revisión de plan de cuentas para determinar obligaciones.',
    created_by: 'admin',
    created_at: '2026-02-01T08:45:00',
    updated_at: '2026-02-03T14:20:00',
  },
  {
    id: 'ci_005',
    number: 'CI-2026-005',
    coordination_id: 'COORDINACION_5',
    taxpayer_id: 'tp_005',
    template_id: 'tpl_002',
    subject_name: 'Restaurante Sabor Venezolano, C.A.',
    subject_rif: 'J-41.876.543-2',
    subject_address: 'Calle Los Proceres, Local 8, Centro Comercial Sabores',
    subject_parish_id: 'Santa Rosalía',
    issue_date: null,
    start_date: '2026-02-05',
    end_date: null,
    status: 'en_revision',
    notes: null,
    created_by: 'fiscal_02',
    created_at: '2026-02-05T09:30:00',
    updated_at: '2026-02-07T11:00:00',
  },
  // ── Emitidos (4) ──
  {
    id: 'ci_006',
    number: 'CI-2026-006',
    coordination_id: 'COORDINACION_1',
    taxpayer_id: 'tp_006',
    template_id: 'tpl_001',
    subject_name: 'Farmacia La Salud, C.A.',
    subject_rif: 'J-40.234.567-8',
    subject_address: 'Av. Francisco de Miranda, Edif. Salud, Local 3',
    subject_parish_id: 'El Recreo',
    issue_date: '2026-02-10',
    start_date: '2026-02-10',
    end_date: '2026-02-25',
    status: 'emitido',
    notes: 'Oficio emitido para inspección programada.',
    created_by: 'admin',
    created_at: '2026-02-10T08:00:00',
    updated_at: '2026-02-10T10:30:00',
  },
  {
    id: 'ci_007',
    number: 'CI-2026-007',
    coordination_id: 'COORDINACION_2',
    taxpayer_id: 'tp_007',
    template_id: 'tpl_002',
    subject_name: 'Papelería El Lápiz, C.A.',
    subject_rif: 'J-41.345.678-9',
    subject_address: 'Calle Real, Centro Comercial El Lápiz, Local 2',
    subject_parish_id: 'Altagracia',
    issue_date: '2026-02-15',
    start_date: '2026-02-15',
    end_date: '2026-03-01',
    status: 'emitido',
    notes: null,
    created_by: 'fiscal_03',
    created_at: '2026-02-15T09:15:00',
    updated_at: '2026-02-15T11:45:00',
  },
  {
    id: 'ci_008',
    number: 'CI-2026-008',
    coordination_id: 'COORDINACION_3',
    taxpayer_id: 'tp_008',
    template_id: 'tpl_003',
    subject_name: 'Abogados & Asociados, C.A.',
    subject_rif: 'J-40.987.654-3',
    subject_address: 'Torre Profesional, Piso 8, Oficina 8-A',
    subject_parish_id: 'San Bernardino',
    issue_date: '2026-02-20',
    start_date: '2026-02-20',
    end_date: '2026-03-10',
    status: 'emitido',
    notes: 'Verificación de declaraciones de ISLR.',
    created_by: 'admin',
    created_at: '2026-02-20T10:00:00',
    updated_at: '2026-02-20T14:15:00',
  },
  {
    id: 'ci_009',
    number: 'CI-2026-009',
    coordination_id: 'COORDINACION_4',
    taxpayer_id: 'tp_009',
    template_id: 'tpl_001',
    subject_name: 'Constructora Horizon, C.A.',
    subject_rif: 'J-41.654.321-0',
    subject_address: 'Av. Principal, Residencias Horizon, PB Local 1',
    subject_parish_id: 'Caricuao',
    issue_date: '2026-02-25',
    start_date: '2026-02-25',
    end_date: '2026-03-15',
    status: 'emitido',
    notes: null,
    created_by: 'fiscal_01',
    created_at: '2026-02-25T08:30:00',
    updated_at: '2026-02-25T09:00:00',
  },
  // ── Notificados (3) ──
  {
    id: 'ci_010',
    number: 'CI-2026-010',
    coordination_id: 'COORDINACION_5',
    taxpayer_id: 'tp_010',
    template_id: 'tpl_002',
    subject_name: 'Estudio Fotográfico Imagen, C.A.',
    subject_rif: 'J-40.456.789-4',
    subject_address: 'Calle Los Samanes, Centro Comercial Foto, Local 7',
    subject_parish_id: 'Sucre',
    issue_date: '2026-03-01',
    start_date: '2026-03-01',
    end_date: '2026-03-20',
    status: 'notificado',
    notes: 'Contribuyente notificado vía Oficina de Notificaciones.',
    created_by: 'admin',
    created_at: '2026-03-01T08:15:00',
    updated_at: '2026-03-05T10:00:00',
  },
  {
    id: 'ci_011',
    number: 'CI-2026-011',
    coordination_id: 'COORDINACION_1',
    taxpayer_id: 'tp_011',
    template_id: 'tpl_003',
    subject_name: 'Consultora Ambiental Verde, C.A.',
    subject_rif: 'J-41.789.012-5',
    subject_address: 'Av. Bolívar, Edif. Verde, Piso 2, Oficina 2-B',
    subject_parish_id: 'El Junquito',
    issue_date: '2026-03-10',
    start_date: '2026-03-10',
    end_date: '2026-03-30',
    status: 'notificado',
    notes: 'Notificación entregada en mano al representante legal.',
    created_by: 'fiscal_02',
    created_at: '2026-03-10T09:00:00',
    updated_at: '2026-03-14T15:30:00',
  },
  {
    id: 'ci_012',
    number: 'CI-2026-012',
    coordination_id: 'COORDINACION_2',
    taxpayer_id: 'tp_012',
    template_id: 'tpl_001',
    subject_name: 'Librería El Conocimiento, C.A.',
    subject_rif: 'J-40.321.654-6',
    subject_address: 'Calle Principal, Centro Comercial Libro, Local 3',
    subject_parish_id: 'La Pastora',
    issue_date: '2026-03-15',
    start_date: '2026-03-15',
    end_date: '2026-04-05',
    status: 'notificado',
    notes: null,
    created_by: 'fiscal_03',
    created_at: '2026-03-15T10:30:00',
    updated_at: '2026-03-19T09:15:00',
  },
  // ── Cerrados (2) ──
  {
    id: 'ci_013',
    number: 'CI-2026-013',
    coordination_id: 'COORDINACION_3',
    taxpayer_id: 'tp_013',
    template_id: 'tpl_002',
    subject_name: 'Taller Mecánico El Motor, C.A.',
    subject_rif: 'J-41.098.765-7',
    subject_address: 'Av. Intercomunal, Galpón 15, Zona Industrial',
    subject_parish_id: 'Coche',
    issue_date: '2026-03-20',
    start_date: '2026-03-20',
    end_date: '2026-04-10',
    status: 'cerrado',
    notes: 'Control completado sin observaciones.',
    created_by: 'admin',
    created_at: '2026-03-20T08:00:00',
    updated_at: '2026-04-10T16:00:00',
  },
  {
    id: 'ci_014',
    number: 'CI-2026-014',
    coordination_id: 'COORDINACION_4',
    taxpayer_id: 'tp_014',
    template_id: 'tpl_003',
    subject_name: 'Minimarket 24 Horas, C.A.',
    subject_rif: 'J-40.876.543-8',
    subject_address: 'Calle Los Pajaritos, Local 10, Centro Comercial Aves',
    subject_parish_id: 'San José',
    issue_date: '2026-04-01',
    start_date: '2026-04-01',
    end_date: '2026-04-20',
    status: 'cerrado',
    notes: 'Control finalizado. Contribuyente en cumplimiento.',
    created_by: 'fiscal_01',
    created_at: '2026-04-01T09:30:00',
    updated_at: '2026-04-20T14:45:00',
  },
  // ── Reemitido (1) ──
  {
    id: 'ci_015',
    number: 'CI-2026-015',
    coordination_id: 'COORDINACION_5',
    taxpayer_id: 'tp_015',
    template_id: 'tpl_001',
    subject_name: 'Inmobiliaria Caracas, C.A.',
    subject_rif: 'J-41.543.210-9',
    subject_address: 'Torre Empresarial, Piso 12, Oficina 12-C',
    subject_parish_id: 'El Valle',
    issue_date: '2026-04-10',
    start_date: '2026-04-10',
    end_date: '2026-04-30',
    status: 'reemitido',
    notes: 'Reemitido por error en datos del contribuyente. Se corrigió RIF.',
    created_by: 'admin',
    created_at: '2026-04-10T08:00:00',
    updated_at: '2026-04-15T11:30:00',
  },
];

// ── Plantillas (3) ────────────────────────────────────────────────────────────
export const controlesIngresoTemplatesMock: ControlIngresoTemplate[] = [
  {
    id: 'tpl_001',
    coordination_id: 'COORDINACION_1',
    name: 'Oficio de Control Standard',
    code: 'OC-STD',
    version: 1,
    content: `Oficio N° {{control_number}}

Caracas, {{issue_date}}

SEÑOR(A) {{subject_name}}
RIF: {{subject_rif}}
DIRECCIÓN: {{subject_address}}

Por medio de la presente, se le notifica que esta Dirección de Control ha iniciado un procedimiento de control de ingreso en su contra, conforme a las disposiciones legales vigentes.

El presente control tiene por objeto verificar el cumplimiento de las obligaciones tributarias correspondientes.

Atentamente,
_________________________
Fiscal Responsable`,
    variables: ['control_number', 'subject_name', 'subject_rif', 'subject_address', 'issue_date'],
    is_active: true,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  },
  {
    id: 'tpl_002',
    coordination_id: 'COORDINACION_2',
    name: 'Oficio de Inspección',
    code: 'OI-INS',
    version: 1,
    content: `Oficio de Inspección N° {{control_number}}

Caracas, {{issue_date}}

SEÑOR(A) {{subject_name}}
RIF: {{subject_rif}}

Se ordena la inspección del establecimiento comercial de su propiedad, ubicado en {{subject_address}}, a partir del día {{start_date}}.

Se solicita su colaboración para el acceso a las instalaciones y documentación requerida.

Atentamente,
_________________________
Coordinador de Inspección`,
    variables: ['control_number', 'subject_name', 'subject_rif', 'subject_address', 'issue_date', 'start_date'],
    is_active: true,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-01-01T00:00:00',
  },
  {
    id: 'tpl_003',
    coordination_id: 'COORDINACION_3',
    name: 'Oficio de Verificación',
    code: 'OV-VER',
    version: 2,
    content: `Oficio de Verificación N° {{control_number}}

Caracas, {{issue_date}}

SEÑOR(A) {{subject_name}}
DIRECCIÓN: {{subject_address}}

De conformidad con la normativa tributaria, se procederá a la verificación de sus declaraciones y registros contables correspondientes al período fiscal en cuestión.

La verificación se realizará hasta el día {{end_date}}.

Atentamente,
_________________________
Director de Verificación`,
    variables: ['control_number', 'subject_name', 'subject_address', 'issue_date', 'end_date'],
    is_active: true,
    created_at: '2026-01-01T00:00:00',
    updated_at: '2026-02-15T00:00:00',
  },
];

// ── Fiscales Asignados ────────────────────────────────────────────────────────
export const controlesIngresoAssigneesMock: ControlIngresoAssignee[] = [
  // ci_001
  { id: 'asg_001', control_id: 'ci_001', full_name: 'María González', identity_document: 'V-12.345.678', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-01-10T08:30:00' },
  { id: 'asg_002', control_id: 'ci_001', full_name: 'Carlos Rodríguez', identity_document: 'V-23.456.789', role_name: 'Supervisor', position: 'Supervisor de Campo', is_manual: false, created_at: '2026-01-10T08:30:00' },
  // ci_002
  { id: 'asg_003', control_id: 'ci_002', full_name: 'Ana Martínez', identity_document: 'V-34.567.890', role_name: 'Fiscal', position: 'Fiscal Asistente', is_manual: false, created_at: '2026-01-15T09:00:00' },
  { id: 'asg_004', control_id: 'ci_002', full_name: 'Luis Hernández', identity_document: 'V-45.678.901', role_name: 'Fiscal', position: 'Fiscal de Campo', is_manual: false, created_at: '2026-01-15T09:00:00' },
  { id: 'asg_005', control_id: 'ci_002', full_name: 'Pedro Sánchez', identity_document: 'V-56.789.012', role_name: 'Supervisor', position: 'Supervisor General', is_manual: false, created_at: '2026-01-15T09:00:00' },
  // ci_003
  { id: 'asg_006', control_id: 'ci_003', full_name: 'Carmen López', identity_document: 'V-67.890.123', role_name: 'Fiscal', position: 'Fiscal Senior', is_manual: false, created_at: '2026-01-20T10:15:00' },
  { id: 'asg_007', control_id: 'ci_003', full_name: 'Roberto Díaz', identity_document: 'V-78.901.234', role_name: 'Fiscal', position: 'Fiscal de Apoyo', is_manual: true, created_at: '2026-01-20T10:15:00' },
  // ci_004
  { id: 'asg_008', control_id: 'ci_004', full_name: 'Jorge Pérez', identity_document: 'V-89.012.345', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-02-01T08:45:00' },
  { id: 'asg_009', control_id: 'ci_004', full_name: 'María González', identity_document: 'V-12.345.678', role_name: 'Supervisor', position: 'Supervisor de Área', is_manual: false, created_at: '2026-02-01T08:45:00' },
  { id: 'asg_010', control_id: 'ci_004', full_name: 'Andrés Ramírez', identity_document: 'V-90.123.456', role_name: 'Fiscal', position: 'Fiscal de Campo', is_manual: false, created_at: '2026-02-01T08:45:00' },
  // ci_005
  { id: 'asg_011', control_id: 'ci_005', full_name: 'Laura Fernández', identity_document: 'V-01.234.567', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-02-05T09:30:00' },
  { id: 'asg_012', control_id: 'ci_005', full_name: 'Miguel Torres', identity_document: 'V-11.223.344', role_name: 'Fiscal', position: 'Fiscal Asistente', is_manual: false, created_at: '2026-02-05T09:30:00' },
  // ci_006
  { id: 'asg_013', control_id: 'ci_006', full_name: 'Sandra Morales', identity_document: 'V-22.334.455', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-02-10T08:00:00' },
  { id: 'asg_014', control_id: 'ci_006', full_name: 'Carlos Rodríguez', identity_document: 'V-23.456.789', role_name: 'Supervisor', position: 'Supervisor de Campo', is_manual: false, created_at: '2026-02-10T08:00:00' },
  { id: 'asg_015', control_id: 'ci_006', full_name: 'Ana Martínez', identity_document: 'V-34.567.890', role_name: 'Fiscal', position: 'Fiscal de Apoyo', is_manual: true, created_at: '2026-02-10T08:00:00' },
  // ci_007
  { id: 'asg_016', control_id: 'ci_007', full_name: 'Fernando Castillo', identity_document: 'V-33.445.566', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-02-15T09:15:00' },
  { id: 'asg_017', control_id: 'ci_007', full_name: 'María González', identity_document: 'V-12.345.678', role_name: 'Supervisor', position: 'Supervisor General', is_manual: false, created_at: '2026-02-15T09:15:00' },
  // ci_008
  { id: 'asg_018', control_id: 'ci_008', full_name: 'Roberto Díaz', identity_document: 'V-78.901.234', role_name: 'Fiscal', position: 'Fiscal Senior', is_manual: false, created_at: '2026-02-20T10:00:00' },
  { id: 'asg_019', control_id: 'ci_008', full_name: 'Laura Fernández', identity_document: 'V-01.234.567', role_name: 'Fiscal', position: 'Fiscal de Campo', is_manual: false, created_at: '2026-02-20T10:00:00' },
  { id: 'asg_020', control_id: 'ci_008', full_name: 'Pedro Sánchez', identity_document: 'V-56.789.012', role_name: 'Supervisor', position: 'Supervisor de Área', is_manual: false, created_at: '2026-02-20T10:00:00' },
  // ci_009
  { id: 'asg_021', control_id: 'ci_009', full_name: 'Sandra Morales', identity_document: 'V-22.334.455', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-02-25T08:30:00' },
  { id: 'asg_022', control_id: 'ci_009', full_name: 'Jorge Pérez', identity_document: 'V-89.012.345', role_name: 'Fiscal', position: 'Fiscal de Apoyo', is_manual: true, created_at: '2026-02-25T08:30:00' },
  // ci_010
  { id: 'asg_023', control_id: 'ci_010', full_name: 'Carmen López', identity_document: 'V-67.890.123', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-03-01T08:15:00' },
  { id: 'asg_024', control_id: 'ci_010', full_name: 'Fernando Castillo', identity_document: 'V-33.445.566', role_name: 'Supervisor', position: 'Supervisor de Campo', is_manual: false, created_at: '2026-03-01T08:15:00' },
  // ci_011
  { id: 'asg_025', control_id: 'ci_011', full_name: 'Andrés Ramírez', identity_document: 'V-90.123.456', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-03-10T09:00:00' },
  { id: 'asg_026', control_id: 'ci_011', full_name: 'Miguel Torres', identity_document: 'V-11.223.344', role_name: 'Fiscal', position: 'Fiscal de Campo', is_manual: false, created_at: '2026-03-10T09:00:00' },
  { id: 'asg_027', control_id: 'ci_011', full_name: 'María González', identity_document: 'V-12.345.678', role_name: 'Supervisor', position: 'Supervisor General', is_manual: false, created_at: '2026-03-10T09:00:00' },
  // ci_012
  { id: 'asg_028', control_id: 'ci_012', full_name: 'Laura Fernández', identity_document: 'V-01.234.567', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-03-15T10:30:00' },
  { id: 'asg_029', control_id: 'ci_012', full_name: 'Carlos Rodríguez', identity_document: 'V-23.456.789', role_name: 'Supervisor', position: 'Supervisor de Campo', is_manual: false, created_at: '2026-03-15T10:30:00' },
  // ci_013
  { id: 'asg_030', control_id: 'ci_013', full_name: 'Jorge Pérez', identity_document: 'V-89.012.345', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-03-20T08:00:00' },
  { id: 'asg_031', control_id: 'ci_013', full_name: 'Carmen López', identity_document: 'V-67.890.123', role_name: 'Fiscal', position: 'Fiscal de Apoyo', is_manual: false, created_at: '2026-03-20T08:00:00' },
  // ci_014
  { id: 'asg_032', control_id: 'ci_014', full_name: 'Sandra Morales', identity_document: 'V-22.334.455', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-04-01T09:30:00' },
  { id: 'asg_033', control_id: 'ci_014', full_name: 'Ana Martínez', identity_document: 'V-34.567.890', role_name: 'Fiscal', position: 'Fiscal de Campo', is_manual: false, created_at: '2026-04-01T09:30:00' },
  { id: 'asg_034', control_id: 'ci_014', full_name: 'Pedro Sánchez', identity_document: 'V-56.789.012', role_name: 'Supervisor', position: 'Supervisor de Área', is_manual: false, created_at: '2026-04-01T09:30:00' },
  // ci_015
  { id: 'asg_035', control_id: 'ci_015', full_name: 'Andrés Ramírez', identity_document: 'V-90.123.456', role_name: 'Fiscal', position: 'Fiscal Principal', is_manual: false, created_at: '2026-04-10T08:00:00' },
  { id: 'asg_036', control_id: 'ci_015', full_name: 'Fernando Castillo', identity_document: 'V-33.445.566', role_name: 'Supervisor', position: 'Supervisor General', is_manual: false, created_at: '2026-04-10T08:00:00' },
  { id: 'asg_037', control_id: 'ci_015', full_name: 'Laura Fernández', identity_document: 'V-01.234.567', role_name: 'Fiscal', position: 'Fiscal de Apoyo', is_manual: true, created_at: '2026-04-10T08:00:00' },
];

// ── Documentos Generados ──────────────────────────────────────────────────────
export const controlesIngresoDocumentsMock: ControlIngresoDocument[] = [
  {
    id: 'doc_001',
    control_id: 'ci_006',
    template_version: 1,
    rendered_content: `Oficio N° CI-2026-006

Caracas, 10/02/2026

SEÑOR(A) Farmacia La Salud, C.A.
RIF: J-40.234.567-8
DIRECCIÓN: Av. Francisco de Miranda, Edif. Salud, Local 3

Por medio de la presente, se le notifica que esta Dirección de Control ha iniciado un procedimiento de control de ingreso en su contra, conforme a las disposiciones legales vigentes.

El presente control tiene por objeto verificar el cumplimiento de las obligaciones tributarias correspondientes.

Atentamente,
_________________________
Fiscal Responsable`,
    file_url: null,
    file_type: null,
    generated_at: '2026-02-10T10:30:00',
    generated_by: 'admin',
  },
  {
    id: 'doc_002',
    control_id: 'ci_007',
    template_version: 1,
    rendered_content: `Oficio de Inspección N° CI-2026-007

Caracas, 15/02/2026

SEÑOR(A) Papelería El Lápiz, C.A.
RIF: J-41.345.678-9

Se ordena la inspección del establecimiento comercial de su propiedad, ubicado en Calle Real, Centro Comercial El Lápiz, Local 2, a partir del día 15/02/2026.

Se solicita su colaboración para el acceso a las instalaciones y documentación requerida.

Atentamente,
_________________________
Coordinador de Inspección`,
    file_url: null,
    file_type: null,
    generated_at: '2026-02-15T11:45:00',
    generated_by: 'fiscal_03',
  },
  {
    id: 'doc_003',
    control_id: 'ci_008',
    template_version: 2,
    rendered_content: `Oficio de Verificación N° CI-2026-008

Caracas, 20/02/2026

SEÑOR(A) Abogados & Asociados, C.A.
DIRECCIÓN: Torre Profesional, Piso 8, Oficina 8-A

De conformidad con la normativa tributaria, se procederá a la verificación de sus declaraciones y registros contables correspondientes al período fiscal en cuestión.

La verificación se realizará hasta el día 10/03/2026.

Atentamente,
_________________________
Director de Verificación`,
    file_url: null,
    file_type: null,
    generated_at: '2026-02-20T14:15:00',
    generated_by: 'admin',
  },
  {
    id: 'doc_004',
    control_id: 'ci_009',
    template_version: 1,
    rendered_content: `Oficio N° CI-2026-009

Caracas, 25/02/2026

SEÑOR(A) Constructora Horizon, C.A.
RIF: J-41.654.321-0
DIRECCIÓN: Av. Principal, Residencias Horizon, PB Local 1

Por medio de la presente, se le notifica que esta Dirección de Control ha iniciado un procedimiento de control de ingreso en su contra, conforme a las disposiciones legales vigentes.

El presente control tiene por objeto verificar el cumplimiento de las obligaciones tributarias correspondientes.

Atentamente,
_________________________
Fiscal Responsable`,
    file_url: null,
    file_type: null,
    generated_at: '2026-02-25T09:00:00',
    generated_by: 'fiscal_01',
  },
  {
    id: 'doc_005',
    control_id: 'ci_010',
    template_version: 1,
    rendered_content: `Oficio de Inspección N° CI-2026-010

Caracas, 01/03/2026

SEÑOR(A) Estudio Fotográfico Imagen, C.A.
RIF: J-40.456.789-4

Se ordena la inspección del establecimiento comercial de su propiedad, ubicado en Calle Los Samanes, Centro Comercial Foto, Local 7, a partir del día 01/03/2026.

Se solicita su colaboración para el acceso a las instalaciones y documentación requerida.

Atentamente,
_________________________
Coordinador de Inspección`,
    file_url: null,
    file_type: null,
    generated_at: '2026-03-01T10:00:00',
    generated_by: 'admin',
  },
  {
    id: 'doc_006',
    control_id: 'ci_015',
    template_version: 1,
    rendered_content: `Oficio N° CI-2026-015 (REEMITIDO)

Caracas, 10/04/2026

SEÑOR(A) Inmobiliaria Caracas, C.A.
RIF: J-41.543.210-9
DIRECCIÓN: Torre Empresarial, Piso 12, Oficina 12-C

Por medio de la presente, se le notifica que esta Dirección de Control ha iniciado un procedimiento de control de ingreso en su contra, conforme a las disposiciones legales vigentes.

El presente control tiene por objeto verificar el cumplimiento de las obligaciones tributarias correspondientes.

NOTA: Este oficio reemplaza al emitido el 10/04/2026 con corrección de datos del contribuyente.

Atentamente,
_________________________
Fiscal Responsable`,
    file_url: null,
    file_type: null,
    generated_at: '2026-04-15T11:30:00',
    generated_by: 'admin',
  },
];

// ── Logs de Auditoría ─────────────────────────────────────────────────────────
export const controlesIngresoAuditLogsMock: ControlIngresoAuditLog[] = [
  // ci_001
  { id: 'log_001', control_id: 'ci_001', action: 'CREATED', previous_value: null, new_value: 'Control creado', created_by: 'admin', created_at: '2026-01-10T08:30:00' },
  { id: 'log_002', control_id: 'ci_001', action: 'ASSIGNEE_ADDED', previous_value: null, new_value: 'María González asignada como Fiscal Principal', created_by: 'admin', created_at: '2026-01-10T08:30:00' },
  // ci_004
  { id: 'log_003', control_id: 'ci_004', action: 'CREATED', previous_value: null, new_value: 'Control creado', created_by: 'admin', created_at: '2026-02-01T08:45:00' },
  { id: 'log_004', control_id: 'ci_004', action: 'STATUS_CHANGED', previous_value: 'borrador', new_value: 'en_revision', created_by: 'admin', created_at: '2026-02-03T14:20:00' },
  // ci_006
  { id: 'log_005', control_id: 'ci_006', action: 'CREATED', previous_value: null, new_value: 'Control creado', created_by: 'admin', created_at: '2026-02-10T08:00:00' },
  { id: 'log_006', control_id: 'ci_006', action: 'STATUS_CHANGED', previous_value: 'borrador', new_value: 'en_revision', created_by: 'admin', created_at: '2026-02-10T08:30:00' },
  { id: 'log_007', control_id: 'ci_006', action: 'STATUS_CHANGED', previous_value: 'en_revision', new_value: 'emitido', created_by: 'admin', created_at: '2026-02-10T10:30:00' },
  { id: 'log_008', control_id: 'ci_006', action: 'DOCUMENT_GENERATED', previous_value: null, new_value: 'Oficio de Control generado', created_by: 'admin', created_at: '2026-02-10T10:30:00' },
  // ci_010
  { id: 'log_009', control_id: 'ci_010', action: 'CREATED', previous_value: null, new_value: 'Control creado', created_by: 'admin', created_at: '2026-03-01T08:15:00' },
  { id: 'log_010', control_id: 'ci_010', action: 'STATUS_CHANGED', previous_value: 'borrador', new_value: 'emitido', created_by: 'admin', created_at: '2026-03-01T09:00:00' },
  { id: 'log_011', control_id: 'ci_010', action: 'STATUS_CHANGED', previous_value: 'emitido', new_value: 'notificado', created_by: 'admin', created_at: '2026-03-05T10:00:00' },
  { id: 'log_012', control_id: 'ci_010', action: 'NOTIFICATION_SENT', previous_value: null, new_value: 'Notificación enviada a Oficina de Notificaciones', created_by: 'admin', created_at: '2026-03-05T10:00:00' },
  // ci_013
  { id: 'log_013', control_id: 'ci_013', action: 'CREATED', previous_value: null, new_value: 'Control creado', created_by: 'admin', created_at: '2026-03-20T08:00:00' },
  { id: 'log_014', control_id: 'ci_013', action: 'STATUS_CHANGED', previous_value: 'borrador', new_value: 'emitido', created_by: 'admin', created_at: '2026-03-20T08:30:00' },
  { id: 'log_015', control_id: 'ci_013', action: 'STATUS_CHANGED', previous_value: 'emitido', new_value: 'notificado', created_by: 'admin', created_at: '2026-03-22T09:00:00' },
  { id: 'log_016', control_id: 'ci_013', action: 'STATUS_CHANGED', previous_value: 'notificado', new_value: 'cerrado', created_by: 'admin', created_at: '2026-04-10T16:00:00' },
  // ci_015
  { id: 'log_017', control_id: 'ci_015', action: 'CREATED', previous_value: null, new_value: 'Control creado', created_by: 'admin', created_at: '2026-04-10T08:00:00' },
  { id: 'log_018', control_id: 'ci_015', action: 'STATUS_CHANGED', previous_value: 'borrador', new_value: 'emitido', created_by: 'admin', created_at: '2026-04-10T09:00:00' },
  { id: 'log_019', control_id: 'ci_015', action: 'STATUS_CHANGED', previous_value: 'emitido', new_value: 'reemitido', created_by: 'admin', created_at: '2026-04-15T11:30:00' },
  { id: 'log_020', control_id: 'ci_015', action: 'DOCUMENT_GENERATED', previous_value: null, new_value: 'Oficio reemitido con corrección de RIF', created_by: 'admin', created_at: '2026-04-15T11:30:00' },
];

// ── Estadísticas Pre-computadas ───────────────────────────────────────────────
export const controlesIngresoStatsMock: ControlesIngresoStats = {
  total: 15,
  borradores: 3,
  en_revision: 2,
  emitidos: 4,
  notificados: 3,
  cerrados: 2,
  reemitidos: 1,
  porCoordinacion: [
    { name: 'Coordinación 1', count: 4 },
    { name: 'Coordinación 2', count: 3 },
    { name: 'Coordinación 3', count: 3 },
    { name: 'Coordinación 4', count: 3 },
    { name: 'Coordinación 5', count: 2 },
  ],
  porEstado: [
    { name: 'Borrador', count: 3, fill: '#64748b' },
    { name: 'En revisión', count: 2, fill: '#eab308' },
    { name: 'Emitido', count: 4, fill: '#3b82f6' },
    { name: 'Notificado', count: 3, fill: '#a855f7' },
    { name: 'Cerrado', count: 2, fill: '#22c55e' },
    { name: 'Reemitido', count: 1, fill: '#f97316' },
  ],
};
