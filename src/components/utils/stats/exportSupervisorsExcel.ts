import ExcelJS from "exceljs";
import { GroupData } from "@/types/stats";

export const exportSupervisorsExcel = async (
    supervisorData: GroupData[],
    fileName: string
) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Supervisores");

    // Función para reemplazar nombre solo en coordinación 1
    const getDisplayName = (name: string, groupName: string) => {
        const normalizedGroupName = groupName.replace(/GRUPO/gi, 'COORDINACIÓN');
        if (normalizedGroupName === 'COORDINACIÓN 1' && name === 'Alieska Yepez') {
            return 'Estefany Rincon';
        }
        return name;
    };

    // Headers
    sheet.addRow([
        "Coordinación",
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
            const displayGroupName = group.name.replace(/GRUPO/gi, 'COORDINACIÓN');
            const displaySupervisorName = s ? getDisplayName(s.name, group.name) : "-";
            
            sheet.addRow([
                displayGroupName,
                label,
                displaySupervisorName,
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
