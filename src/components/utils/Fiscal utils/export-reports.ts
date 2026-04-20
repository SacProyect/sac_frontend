import ExcelJS from "exceljs";

export interface TaxpayerRow {
    name: string;
    rif: string;
    complianceRate: number;
    totalIva: number;
    totalIslr: number;
    totalFines: number;
    totalCollected: number;
}



export const exportExcel = async (data: TaxpayerRow[], fileName: string, fiscalName: string,) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte");

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
    data.forEach((t, idx) => {
        sheet.addRow([
            idx + 1,
            t.name,
            t.rif,
            `${t.complianceRate}%`,
            t.totalIva,
            t.totalIslr,
            t.totalFines,
            t.totalCollected,
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
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    // El archivo se llamará "FiscalName - high-compliance.xlsx"
    const safeFiscalName = fiscalName.replace(/\s+/g, "_"); // por si hay espacios
    link.download = `${safeFiscalName}-${fileName}.xlsx`;
    link.click();

    window.URL.revokeObjectURL(url);
};
