import ExcelJS from "exceljs";
import { GroupData } from "@/types/stats";

export const exportSupervisorsExcel = async (
    supervisorData: GroupData[],
    fileName: string
) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Supervisores");

    // Headers
    sheet.addRow([
        "Grupo",
        "Cargo",
        "Nombre",
        "IVA",
        "ISLR",
        "Multas",
        "Total",
    ]);

    supervisorData.forEach((group) => {
        const best = group.supervisors.find((s) => s.name === group.best);
        const worst = group.supervisors.find((s) => s.name === group.worse);

        const row = (label: string, s?: any) => {
            sheet.addRow([
                group.name,
                label,
                s?.name || "-",
                s?.collectedIva || 0,
                s?.collectedIslr || 0,
                s?.collectedFines || 0,
                s?.total || 0,
            ]);
        };

        row("Mejor Supervisor", best);
        row("Menor Supervisor", worst);
    });

    // Ajustar ancho automático
    sheet.columns.forEach((col) => {
        let maxLength = 10;
        col.eachCell?.({ includeEmpty: true }, (cell) => {
            maxLength = Math.max(maxLength, cell.value?.toString().length || 0);
        });
        col.width = maxLength + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
};
