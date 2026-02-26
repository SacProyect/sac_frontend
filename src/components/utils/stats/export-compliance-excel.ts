import ExcelJS from "exceljs";
import { High } from "@/types/stats";

export const exportComplianceExcel = async (
    data: High[],
    fileName: string
) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Cumplimiento");

    // Headers
    sheet.addRow([
        "N°",
        "Nombre",
        "RIF",
        "% Cumplimiento",
        "IVA",
        "ISLR",
        "Multas",
        "Total Pagado",
    ]);

    // Rows
    data.forEach((c, idx) => {
        sheet.addRow([
            idx + 1,
            c.name,
            c.rif,
            `${c.compliance}%`,
            c.totalIVA,
            c.totalISLR,
            c.totalFines,
            c.totalCollected,
        ]);
    });

    // Auto width
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
