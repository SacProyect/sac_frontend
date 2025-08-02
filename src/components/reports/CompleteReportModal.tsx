import React, { useState } from "react";
import { User, X } from "lucide-react";
import toast from "react-hot-toast";
import { getCompleteReport } from "../utils/api/reportFunctions";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Props {
    onClose: () => void;
    groups: { id: string; name: string }[];
}

const CompleteReportModal: React.FC<Props> = ({ onClose, groups }) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>("");
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [process, setProcess] = useState<"AF" | "VDF" | "FP" | "">("");
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        navigate("/login");
        return;
    }


    const formatCurrency = (amount: number | string | null | undefined) => {
        const safeAmount = Number(amount) || 0;
        return safeAmount.toLocaleString("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        });
    };

    const handleSubmit = async () => {
        try {
            // console.log(startDate);
            // console.log(endDate);

            // Validaciones previas
            if (startDate && isNaN(new Date(startDate).getTime())) {
                toast.error("La fecha de inicio no es válida. Usa el formato YYYY-MM-DD.");
                return;
            }

            if (endDate && isNaN(new Date(endDate).getTime())) {
                toast.error("La fecha final no es válida. Usa el formato YYYY-MM-DD.");
                return;
            }

            const startUTC = startDate ? new Date(`${startDate}T00:00:00Z`).toISOString() : undefined;
            const endUTC = endDate ? new Date(`${endDate}T23:59:59Z`).toISOString() : undefined;

            if (startUTC && endUTC && startUTC > endUTC) {
                toast.error("La fecha de inicio no puede ser mayor que la fecha final.");
                return;
            }

            const filters = {
                groupId: selectedGroupId || undefined,
                startDate: startUTC,
                endDate: endUTC,
                process: process || undefined,
            };

            const data = await getCompleteReport(filters);
            if (!data || data.length === 0) {
                toast.error("No hay datos para generar el reporte.");
                return;
            }

            generatePDF(data);
            onClose();
        } catch (error) {
            toast.error("Ocurrió un error al generar el reporte.");
            console.error(error);
        }
    };

    const generatePDF = (data: any[]) => {
        data.sort((a, b) => a.name.localeCompare(b.name));


        const printWindow = window.open("about:blank", "_blank");
        if (!printWindow) return;

        let html = `
            <html>
            <head>
                <title>Sistema de Administración de Contribuyentes</title>
                <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 2px;
                    background: #fff;
                    color: #111;
                    text-transform: lowercase;
                }
                h1 {
                    text-align: center;
                    color: #2b6cb0;
                    margin-bottom: 40px;
                    font-size: 18px;
                }
                h2 {
                    color: #2b6cb0;
                    margin-top: 30px;
                    font-size: 16px;
                }
                h3 {
                font-size: 14px;
                margin-top: 15px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    font-size: 11px;
                }
                th, td {
                    padding: 4px;
                    border: 1px solid #ccc;
                    text-align: center;
                }
                th {
                    background-color: #f0f0f0;
                }
                </style>
            </head>
            <body>
                <h1>REPORTE GENERAL</h1>
            `;

        data.forEach((group: any) => {
            html += `<h2>Grupo: ${group.name}</h2>`;
            group.fiscales.sort((a: any, b: any) => a.name.localeCompare(b.name));
            group.fiscales.forEach((fiscal: any) => {
                html += `<h3>Fiscal: ${fiscal.name}</h3>`;
                html += `
                <table>
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Contribuyente</th>
                        <th>RIF</th>
                        <th>Dirección</th>
                        <th>Fecha creación</th>
                        <th>Fecha emisión</th>
                        <th>Tipo de proceso</th>
                        <th>Fase</th>
                        <th>Culminado</th>
                        <th>Notificado</th>
                        <th>Acta de Reparo</th>
                        <th># Multas</th>
                        <th>IVA</th>
                        <th>ISLR</th>
                        <th>Multas</th>
                        <th>Total</th>
                    </tr>
                    </thead>
                    <tbody>
                `;

                fiscal.taxpayers.forEach((t: any, i: number) => {
                    html += `
                    <tr>
                    <td>${i + 1}</td>
                    <td>${t.name}</td>
                    <td>${t.rif}</td>
                    <td>${t.address}</td>
                    <td>${new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>${new Date(t.emissionDate).toLocaleDateString()}</td>
                    <td>${t.process}</td>
                    <td>${t.process === "AF" ? t.fase || "N/A" : "—"}</td>
                    <td>${t.culminated ? "Sí" : "No"}</td>
                    <td>${t.notified ? "Sí" : "No"}</td>
                    <td>${t.process === "AF" ? (t.hasRepairAct ? "Sí" : "No") : "—"}</td>
                    <td>${t.finesCount.toLocaleString()}</td>
                    <td>${formatCurrency(t.totalIva)}</td>
                    <td>${formatCurrency(t.totalIslr)}</td>
                    <td>${formatCurrency(t.totalFines)}</td>
                    <td>${formatCurrency(t.totalCollected)}</td>
                    </tr>
                `;
                });

                html += `</tbody></table>`;
            });
        });

        html += `</body></html>`;
        printWindow.document.write(html);
        printWindow.document.title = "Sistema de Administración de Contribuyentes";
        printWindow.document.close();
        printWindow.print();
    };

    if (user.role === "SUPERVISOR") {
        console.log(user);
        if (!user.groupId) toast.error("No se pudo encontrar el id correspondiente a su grupo.");
        groups.filter((group) => group.id === user.groupId);
    } else if (user.role === "COORDINATOR") {
        if (!user.coordinatedGroup.id) toast.error("No se pudo encontrar el id correspondiente a su grupo.");
        groups.filter((group) => group.id === user.coordinatedGroup.id);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="relative w-full max-w-xl p-6 bg-white rounded-lg shadow-lg animate-fadeIn">
                <button
                    className="absolute text-gray-500 top-3 right-3 hover:text-gray-700"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>

                <h2 className="mb-6 text-xl font-bold text-center text-gray-800">
                    GENERAR REPORTE GENERAL
                </h2>

                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-1 font-medium text-gray-700">Seleccionar grupo</label>
                        <select
                            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                        >
                            {user.role === "ADMIN" && (
                                <option value="">Todos los grupos</option>
                            )}
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block mb-1 font-medium text-gray-700">Desde</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block mb-1 font-medium text-gray-700">Hasta</label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <label className="block mb-1 font-medium text-gray-700">Tipo de procedimiento</label>
                    <select
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                        value={process}
                        onChange={(e) => setProcess(e.target.value as "AF" | "VDF" | "FP" | "")}
                    >
                        <option value="">Todos</option>
                        <option value="AF">AF</option>
                        <option value="VDF">VDF</option>
                        <option value="FP">FP</option>
                    </select>

                    <div className="flex justify-end gap-4 pt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
                        >
                            Generar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompleteReportModal;
