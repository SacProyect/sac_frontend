import ExcelJS from "exceljs";
import { BestGrowth } from "@/types/stats";

export const exportTopGrowthExcel = async (
    data: BestGrowth[],
    fileName: string
) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Crecimiento Coordinadores");

    // Headers
    sheet.addRow([
        "N°",
        "Coordinador",
        "Grupo",
        "Mes Anterior",
        "Mes Actual",
        "% Crecimiento",
    ]);

    // Rows
    data.forEach((c, idx) => {
        sheet.addRow([
            idx + 1,
            c.coordinatorName,
            c.groupName,
            c.previousMonth,
            c.currentMonth,
            `${c.growthPercentage.toFixed(2)}%`,
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

    // Download
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
