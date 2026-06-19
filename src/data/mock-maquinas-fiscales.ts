export type MachineState = 'critical' | 'warning' | 'ok' | 'unlinked' | 'no_machine';

export type ParishName =
  | 'Antimano'
  | 'Coche'
  | 'San Bernardino'
  | 'Santa Rosalía'
  | 'Santa Teresa'
  | 'Sucre'
  | 'San Jose'
  | 'El Valle'
  | 'San Agustin'
  | 'El Paraiso'
  | 'Caricuao'
  | '23 de Enero'
  | 'Macarao'
  | 'Altagracia'
  | 'San Juan'
  | 'La Candelaria'
  | 'San Pedro'
  | 'La Vega'
  | 'La Pastora'
  | 'El Junquito'
  | 'El Recreo'
  | 'Catedral';

export interface MachineMock {
  id: string;
  serial: string;
  rif: string;
  razonsocial: string;
  parish: ParishName | 'Libertador';
  municipality: 'Libertador';
  tipoMaquina: 'IMPRESORA_FISCAL' | 'CAJA_REGISTRADORA' | 'OTRO';
  diasSinTransmitir: number | null;
  contribuyenteTipo: 'ORDINARIO' | 'ESPECIAL' | 'DESCONOCIDO';
  estadoSAC: 'enlazado' | 'sin_enlace';
  machineState: MachineState;
  phone?: string;
  activity?: string;
  address?: string;
  lastSeen?: string;
  source: 'MAQUINAS_SIN_TRANSMITIR' | 'LISTADO_SIN_MAQUINA' | 'ANALISIS_PARROQUIA';
  rifVencido: boolean;
}

export interface MachineStatsMock {
  total: number;
  conMaquina: number;
  sinMaquina: number;
  enlazadas: number;
  sinEnlace: number;
  sinTransmitir30: number;
  criticas1000: number;
  enAlerta: number;
  ok: number;
  sinMaquinaCount: number;
  especiales: number;
  ordinarios: number;
  rifVencidos: number;
  parroquiasTop: Array<{ name: string; count: number }>;
  porParroquia: Array<{ name: string; sinMaquina: number; conMaquina: number }>;
  porSeveridad: Array<{ name: string; count: number; fill: string }>;
}

export const maquinasFiscalesMock: MachineMock[] = [
  {
    id: 'mf_001',
    serial: 'Z1F0012247',
    rif: 'J412445502',
    razonsocial: 'GRUPO S.LE,R., C.A',
    parish: 'Libertador',
    municipality: 'Libertador',
    tipoMaquina: 'IMPRESORA_FISCAL',
    diasSinTransmitir: 2360,
    contribuyenteTipo: 'ESPECIAL',
    estadoSAC: 'enlazado',
    machineState: 'critical',
    phone: '0212-555-1201',
    activity: 'Venta al por menor de alimentos',
    address: 'Quinta Crespo, Caracas',
    lastSeen: '2026-06-01',
    source: 'MAQUINAS_SIN_TRANSMITIR',
    rifVencido: true,
  },
  {
    id: 'mf_002',
    serial: 'Z7C0003317',
    rif: 'J410720573',
    razonsocial: 'INVERSIONES MAKE UP A.A., C.A.',
    parish: 'Libertador',
    municipality: 'Libertador',
    tipoMaquina: 'IMPRESORA_FISCAL',
    diasSinTransmitir: 2346,
    contribuyenteTipo: 'ORDINARIO',
    estadoSAC: 'enlazado',
    machineState: 'critical',
    phone: '0212-555-1202',
    activity: 'Venta de artículos de belleza',
    address: 'El Valle, Caracas',
    lastSeen: '2026-05-29',
    source: 'MAQUINAS_SIN_TRANSMITIR',
    rifVencido: true,
  },
  {
    id: 'mf_003',
    serial: 'Z7C0000400',
    rif: 'J408196581',
    razonsocial: 'CORPORACION WIMACELL, C.A.',
    parish: 'Libertador',
    municipality: 'Libertador',
    tipoMaquina: 'IMPRESORA_FISCAL',
    diasSinTransmitir: 2332,
    contribuyenteTipo: 'ESPECIAL',
    estadoSAC: 'sin_enlace',
    machineState: 'critical',
    phone: '0212-555-1203',
    activity: 'Telefonía y accesorios',
    address: 'Centro, Caracas',
    lastSeen: '2026-05-27',
    source: 'MAQUINAS_SIN_TRANSMITIR',
    rifVencido: true,
  },
  {
    id: 'mf_004',
    serial: 'ZZF0005294',
    rif: 'J401057519',
    razonsocial: 'ASOCIACION CIVIL TOPOTEPUY',
    parish: 'Libertador',
    municipality: 'Libertador',
    tipoMaquina: 'CAJA_REGISTRADORA',
    diasSinTransmitir: 2328,
    contribuyenteTipo: 'ESPECIAL',
    estadoSAC: 'enlazado',
    machineState: 'critical',
    phone: '0212-555-1204',
    activity: 'Servicios comunitarios',
    address: 'Antímano, Caracas',
    lastSeen: '2026-05-25',
    source: 'MAQUINAS_SIN_TRANSMITIR',
    rifVencido: false,
  },
  {
    id: 'mf_005',
    serial: 'ZZE2007162',
    rif: 'J404486810',
    razonsocial: 'ELECTRONICA DATACOM, C.A.',
    parish: 'Libertador',
    municipality: 'Libertador',
    tipoMaquina: 'IMPRESORA_FISCAL',
    diasSinTransmitir: 2321,
    contribuyenteTipo: 'ORDINARIO',
    estadoSAC: 'sin_enlace',
    machineState: 'critical',
    phone: '0212-555-1205',
    activity: 'Venta de equipos electrónicos',
    address: 'La Candelaria, Caracas',
    lastSeen: '2026-05-24',
    source: 'MAQUINAS_SIN_TRANSMITIR',
    rifVencido: false,
  },
  {
    id: 'mf_006',
    serial: 'SIN_MAQUINA_J294063438',
    rif: 'J294063438',
    razonsocial: 'CARNICERIA Y CHARCUTERIA AGUSTINHO 2030, C.A.',
    parish: '23 de Enero',
    municipality: 'Libertador',
    tipoMaquina: 'OTRO',
    diasSinTransmitir: null,
    contribuyenteTipo: 'ESPECIAL',
    estadoSAC: 'sin_enlace',
    machineState: 'no_machine',
    phone: '0212-858-0525',
    activity: 'Venta al por menor de alimentos',
    address: '23 de Enero, Caracas',
    source: 'LISTADO_SIN_MAQUINA',
    rifVencido: false,
  },
  {
    id: 'mf_007',
    serial: 'SIN_MAQUINA_J294241786',
    rif: 'J294241786',
    razonsocial: 'SUMINISTROS DAN 2007, C.A.',
    parish: 'La Candelaria',
    municipality: 'Libertador',
    tipoMaquina: 'OTRO',
    diasSinTransmitir: null,
    contribuyenteTipo: 'ESPECIAL',
    estadoSAC: 'sin_enlace',
    machineState: 'no_machine',
    phone: '0212-862-9068',
    activity: 'Venta de suministros y equipos',
    address: 'La Candelaria, Caracas',
    source: 'LISTADO_SIN_MAQUINA',
    rifVencido: false,
  },
  {
    id: 'mf_008',
    serial: 'SIN_MAQUINA_J295983794',
    rif: 'J295983794',
    razonsocial: 'PROPASUBS C.A.',
    parish: 'Sucre',
    municipality: 'Libertador',
    tipoMaquina: 'OTRO',
    diasSinTransmitir: null,
    contribuyenteTipo: 'ESPECIAL',
    estadoSAC: 'sin_enlace',
    machineState: 'no_machine',
    phone: '0212-873-9908',
    activity: 'Restaurantes y comidas móviles',
    address: 'Sucre, Caracas',
    source: 'ANALISIS_PARROQUIA',
    rifVencido: false,
  },
  {
    id: 'mf_009',
    serial: 'Z1B8009058',
    rif: 'J409998001',
    razonsocial: 'FARMACIA LA ESTRELLA, C.A.',
    parish: 'El Recreo',
    municipality: 'Libertador',
    tipoMaquina: 'IMPRESORA_FISCAL',
    diasSinTransmitir: 812,
    contribuyenteTipo: 'ORDINARIO',
    estadoSAC: 'enlazado',
    machineState: 'warning',
    phone: '0212-555-1210',
    activity: 'Farmacia y perfumería',
    address: 'El Recreo, Caracas',
    lastSeen: '2026-05-20',
    source: 'MAQUINAS_SIN_TRANSMITIR',
    rifVencido: false,
  },
  {
    id: 'mf_010',
    serial: 'Z9A1000456',
    rif: 'J401445221',
    razonsocial: 'PANADERIA LA FLOR, C.A.',
    parish: 'Santa Rosalía',
    municipality: 'Libertador',
    tipoMaquina: 'CAJA_REGISTRADORA',
    diasSinTransmitir: 411,
    contribuyenteTipo: 'ORDINARIO',
    estadoSAC: 'sin_enlace',
    machineState: 'warning',
    phone: '0212-555-1211',
    activity: 'Panadería y pastelería',
    address: 'Santa Rosalía, Caracas',
    lastSeen: '2026-05-14',
    source: 'MAQUINAS_SIN_TRANSMITIR',
    rifVencido: false,
  },
  {
    id: 'mf_011',
    serial: 'Z9A1000457',
    rif: 'J401445222',
    razonsocial: 'PANADERIA LA FLOR II, C.A.',
    parish: 'Santa Teresa',
    municipality: 'Libertador',
    tipoMaquina: 'CAJA_REGISTRADORA',
    diasSinTransmitir: 92,
    contribuyenteTipo: 'ORDINARIO',
    estadoSAC: 'enlazado',
    machineState: 'ok',
    phone: '0212-555-1212',
    activity: 'Panadería y pastelería',
    address: 'Santa Teresa, Caracas',
    lastSeen: '2026-06-03',
    source: 'MAQUINAS_SIN_TRANSMITIR',
    rifVencido: false,
  },
  {
    id: 'mf_012',
    serial: 'Z4K9911001',
    rif: 'J404700333',
    razonsocial: 'MERCADO EL BOSQUE, C.A.',
    parish: 'La Vega',
    municipality: 'Libertador',
    tipoMaquina: 'IMPRESORA_FISCAL',
    diasSinTransmitir: 38,
    contribuyenteTipo: 'ESPECIAL',
    estadoSAC: 'enlazado',
    machineState: 'ok',
    phone: '0212-555-1213',
    activity: 'Venta minorista de alimentos',
    address: 'La Vega, Caracas',
    lastSeen: '2026-06-06',
    source: 'MAQUINAS_SIN_TRANSMITIR',
    rifVencido: false,
  },
];

export const maquinasFiscalesStatsMock: MachineStatsMock = {
  total: maquinasFiscalesMock.length,
  conMaquina: maquinasFiscalesMock.filter(x => x.machineState !== 'no_machine').length,
  sinMaquina: maquinasFiscalesMock.filter(x => x.machineState === 'no_machine').length,
  enlazadas: maquinasFiscalesMock.filter(x => x.estadoSAC === 'enlazado').length,
  sinEnlace: maquinasFiscalesMock.filter(x => x.estadoSAC === 'sin_enlace').length,
  sinTransmitir30: maquinasFiscalesMock.filter(x => (x.diasSinTransmitir ?? 0) >= 30).length,
  criticas1000: maquinasFiscalesMock.filter(x => (x.diasSinTransmitir ?? 0) >= 1000).length,
  enAlerta: maquinasFiscalesMock.filter(x => {
    const d = x.diasSinTransmitir ?? 0;
    return d >= 30 && d < 1000;
  }).length,
  ok: maquinasFiscalesMock.filter(x => x.machineState === 'ok').length,
  sinMaquinaCount: maquinasFiscalesMock.filter(x => x.machineState === 'no_machine').length,
  especiales: maquinasFiscalesMock.filter(x => x.contribuyenteTipo === 'ESPECIAL').length,
  ordinarios: maquinasFiscalesMock.filter(x => x.contribuyenteTipo === 'ORDINARIO').length,
  rifVencidos: maquinasFiscalesMock.filter(x => x.rifVencido).length,
  parroquiasTop: [
    { name: 'El Recreo', count: 2070 },
    { name: 'Santa Rosalía', count: 1654 },
    { name: 'Sucre', count: 1500 },
    { name: 'La Candelaria', count: 1122 },
    { name: 'San Juan', count: 919 },
  ],
  porParroquia: [
    { name: '23 de Enero', sinMaquina: 1, conMaquina: 0 },
    { name: 'La Candelaria', sinMaquina: 1, conMaquina: 0 },
    { name: 'La Vega', sinMaquina: 0, conMaquina: 1 },
    { name: 'El Recreo', sinMaquina: 0, conMaquina: 1 },
    { name: 'Santa Rosalía', sinMaquina: 0, conMaquina: 1 },
    { name: 'Santa Teresa', sinMaquina: 0, conMaquina: 1 },
    { name: 'Sucre', sinMaquina: 1, conMaquina: 0 },
  ],
  porSeveridad: [
    { name: 'Crítica', count: maquinasFiscalesMock.filter(x => x.machineState === 'critical').length, fill: '#ef4444' },
    { name: 'Alerta', count: maquinasFiscalesMock.filter(x => x.machineState === 'warning').length, fill: '#eab308' },
    { name: 'Normal', count: maquinasFiscalesMock.filter(x => x.machineState === 'ok').length, fill: '#22c55e' },
    { name: 'Sin máquina', count: maquinasFiscalesMock.filter(x => x.machineState === 'no_machine').length, fill: '#64748b' },
  ],
};
