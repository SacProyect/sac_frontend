import { Shell } from '@/components/gestion-actas/Shell/Shell';

/**
 * Página `/gestion-actas` — Centro de Mando: Actas y Expedientes.
 *
 * La página solo monta el `Shell`; la composición visual (header, fila
 * de Ledger Blocks, tabs) vive dentro de él para mantener aislada la
 * responsabilidad de orquestación del shell.
 *
 * Históricamente (TASK-002) esto era un placeholder; TASK-003 lo
 * reemplaza por el shell real. Los sub-componentes profundos (dropzone,
 * tabla de actas, cards/tabla de expedientes) llegan en TASK-004a+ y
 * TASK-005a+.
 */
export default function GestionActasPage() {
    return <Shell />;
}
