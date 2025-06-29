import { Download, Users } from 'lucide-react'
import React from 'react'


const fiscalesByGroup = {
    "Grupo 1": [
        { name: "Carlos Mendoza", total: 285000 },
        { name: "Ana Beltrán", total: 245000 },
        { name: "Jorge Salinas", total: 235000 },
        { name: "Mónica Reyes", total: 225000 },
        { name: "Ridivo Campos", total: 215000 },
    ],
    "Grupo 2": [
        { name: "Sofía Castillo", total: 272000 },
        { name: "Pablo Núñez", total: 242000 },
        { name: "Carla Medina", total: 232000 },
        { name: "Héctor Ramos", total: 222000 },
        { name: "Natalia Flores", total: 212000 },
    ],
    "Grupo 3": [
        { name: "Fernando Jiménez", total: 265000 },
        { name: "Alejandra Soto", total: 238000 },
        { name: "Rodrigo Aguilar", total: 228000 },
        { name: "Daniela Paredes", total: 218000 },
        { name: "Esteban Cortés", total: 208000 },
    ],
    "Grupo 4": [
        { name: "Lucía Ramírez", total: 258000 },
        { name: "Gonzalo Mendez", total: 235000 },
        { name: "Paola Vásquez", total: 225000 },
        { name: "Iván Rojas", total: 215000 },
        { name: "Gabriela Luna", total: 205000 },
    ],
    "Grupo 5": [
        { name: "Diego Vargas", total: 251000 },
        { name: "Mariana Espinoza", total: 232000 },
        { name: "Óscar Fuentes", total: 222000 },
        { name: "Valeria Ibarra", total: 212000 },
        { name: "Tomás Sandoval", total: 202000 },
    ],
    "Grupo 6": [
        { name: "Valentina Cruz", total: 244000 },
        { name: "Nicolás Herrera", total: 228000 },
        { name: "Renata Morales", total: 218000 },
        { name: "Maximiliano Peña", total: 208000 },
        { name: "Constanza Ruiz", total: 198000 },
    ],
}





function TopFiveFiscals() {

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const downloadPDF = (tableId: string, fileName: string) => {
        // Función para descargar como PDF (implementación básica)
        const element = document.getElementById(tableId)
        if (element) {
            window.print()
        }
    }


    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] rounded-md text-white h-[40vh]">
                <div className="flex flex-row items-center justify-between pb-4 lg:pr-4">
                    <div className="flex items-center justify-center gap-2 text-lg font-semibold lg:pt-4 lg:pl-4">
                        <Users className="w-5 h-5 text-purple-500" />
                        Top 5 Fiscales por Grupo
                    </div>
                    <div className='pt-4'>
                        <div
                            onClick={() => downloadPDF("fiscales-grupo-table", "top-fiscales-por-grupo.pdf")}
                            className="px-2 py-2 text-white bg-blue-600 border-blue-600 rounded-md hover:bg-blue-700"
                        >
                            <Download className="w-4 h-4 rounded-md" />
                        </div>
                    </div>
                </div>
                <div>
                    <div id="fiscales-grupo-table" className="h-[285px] overflow-y-auto custom-scroll p-4 ">
                        <div className="space-y-4 lg:pb-8">
                            {Object.entries(fiscalesByGroup).map(([groupName, fiscales]) => (
                                <div key={groupName} className="border border-[#3a3a39] rounded-lg p-4">
                                    <h3 className="mb-3 font-semibold text-purple-400">{groupName}</h3>
                                    <div className="space-y-2">
                                        {fiscales.map((fiscal, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between py-2 px-3 bg-[#1a1a19] rounded-md"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-purple-600 text-white" : "bg-gray-600 text-white"
                                                            }`}
                                                    >
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-medium">{fiscal.name}</span>
                                                </div>
                                                <span className="font-bold text-green-400">{formatCurrency(fiscal.total)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default TopFiveFiscals