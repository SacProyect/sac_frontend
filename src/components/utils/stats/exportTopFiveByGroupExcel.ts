import ExcelJS from "exceljs";
import { TopFiveFiscalsByGroup } from "@/types/stats";

export const exportTopFiveByGroupExcel = async (
    groups: TopFiveFiscalsByGroup[],
    fileName: string
) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Top 5 Fiscales por Grupo");

    // Encabezados generales
    sheet.addRow(["Grupo", "#", "Nombre", "Total pagado"]);

    groups.forEach((group) => {
        group.fiscals.forEach((f, idx) => {
            sheet.addRow([group.name, idx + 1, f.name, f.total]);
        });
        // Espacio entre grupos
        sheet.addRow([]);
    });

    // Auto ancho de columnas
    sheet.columns.forEach((col) => {
        let maxLength = 10;
        col.eachCell?.({ includeEmpty: true }, (cell) => {
            maxLength = Math.max(maxLength, cell.value?.toString().length || 0);
        });
        col.width = maxLength + 2;
    });

    // Generar blob para descarga
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
