import React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

export const PageThreeStats = () => {
    // Datos simulados (mock). Podrás luego reemplazarlos por datos traídos de tu API.
    const dataMock = [
        { name: "CUMPLIMIENTO DE PAGOS", value: 60, color: "#0080c1" },
        { name: "COMPROMISO DE PAGOS", value: 25, color: "#737373" },
        { name: "INCUMPLIMIENTO DE PAGOS", value: 15, color: "#ffffff" },
    ];

    return (
        <div className="flex justify-center w-full min-h-screen bg-[#1c1c1b] text-white p-8">
            {/* Contenedor principal */}
            <div className="flex w-[900px] h-auto shadow-lg bg-[#1c1c1b]">

                {/* Columna Izquierda - Datos del Contribuyente */}
                <div className="w-1/2 p-6">
                    <h1 className="mb-4 text-xl font-semibold uppercase">
                        Datos del contribuyente
                    </h1>

                    <div className="flex flex-col space-y-2 text-sm">
                        <p><span className="font-bold">NRO DE PROVIDENCIA:</span> 01234</p>
                        <p><span className="font-bold">PROCEDIMIENTO:</span> ABC-12345</p>
                        <p><span className="font-bold">RAZÓN SOCIAL:</span> EJEMPLO, C.A.</p>
                        <p><span className="font-bold">RIF:</span> J-12345678-9</p>
                        <p><span className="font-bold">TIPO DE CONTRIBUYENTE:</span> Ordinario</p>
                        <p><span className="font-bold">OTROS DATOS:</span> Lorem ipsum</p>
                    </div>

                    <p className="mt-6 text-xs leading-5">
                        A continuación, se puede observar el rendimiento individual del
                        contribuyente, la tasa y porcentajes de pagos realizados a tiempo,
                        compromisos de pago y la tasa de incumplimiento. Asimismo, se
                        presenta el porcentaje de contribuyentes multados y cuántos han sido
                        investigados.
                    </p>
                </div>

                {/* Columna Derecha - Bullets + Gráfica Pastel */}
                <div className="flex flex-col items-start w-1/2 p-6">
                    {/* Sección de bullets */}
                    <div className="flex flex-col mb-6 space-y-2">
                        <div className="flex items-center">
                            {/* Circulito Azul */}
                            <span
                                className="inline-block w-3 h-3 mr-2 rounded-full"
                                style={{ backgroundColor: "#0080c1" }}
                            />
                            <span className="text-sm">Cumplimiento de Pagos</span>
                        </div>
                        <div className="flex items-center">
                            {/* Circulito Gris */}
                            <span
                                className="inline-block w-3 h-3 mr-2 rounded-full"
                                style={{ backgroundColor: "#737373" }}
                            />
                            <span className="text-sm">Compromiso de Pagos</span>
                        </div>
                        <div className="flex items-center">
                            {/* Circulito Blanco */}
                            <span
                                className="inline-block w-3 h-3 mr-2 rounded-full"
                                style={{ backgroundColor: "#ffffff" }}
                            />
                            <span className="text-sm">Incumplimiento de Pagos</span>
                        </div>
                    </div>

                    {/* Gráfica estilo pastel */}
                    <div className="flex items-center justify-center w-full">
                        <PieChart width={300} height={220}>
                            <Pie
                                data={dataMock}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label
                            >
                                {dataMock.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </div>
                </div>
            </div>
        </div>
    );
};
