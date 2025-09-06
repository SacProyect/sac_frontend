import ExcelJS from "exceljs";
import { TopFiscals } from "@/types/stats";

export const exportTopFiscalsExcel = async (
    fiscals: TopFiscals[],
    fileName: string
) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Top Fiscales");

    // Encabezados
    sheet.addRow(["#", "Nombre", "IVA", "ISLR", "Multas", "Total"]);

    // Filas
    fiscals.forEach((f, idx) => {
        sheet.addRow([
            idx + 1,
            f.name,
            f.collectedIva,
            f.collectedIslr,
            f.collectedFines,
            f.total,
        ]);
    });

    // Ajustar ancho automático
    sheet.columns.forEach((col) => {
        let maxLength = 10;
        col.eachCell?.({ includeEmpty: true }, (cell) => {
            maxLength = Math.max(maxLength, cell.value?.toString().length || 0);
        });
        col.width = maxLength + 2;
    });

    // Descargar archivo
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
