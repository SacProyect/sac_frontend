import { Building, Calendar, Download, MapPin } from "lucide-react"


// Datos simulados basados en el modelo taxpayer
const fiscalInfo = {
    name: "Carlos Mendoza",
    id: "FISC-001",
    totalTaxpayers: 45,
    activeProcesses: 12,
    completedProcesses: 33,
}


const taxpayersData = [
    {
        id: "tp-001",
        name: "Empresa ABC C.A.",
        rif: "J-12345678-9",
        providenceNum: 2024001,
        address: "Av. Libertador, Caracas",
        process: "FISCALIZACION",
        contract_type: "ORDINARY",
        status: true,
        fase: "FASE_3",
        notified: true,
        culminated: false,
        emition_date: "2024-01-15",
        iva: 450000,
        islr: 280000,
        multas: 0,
        totalRecaudado: 730000,
    },
    {
        id: "tp-002",
        name: "Corporación XYZ S.A.",
        rif: "J-87654321-0",
        providenceNum: 2024002,
        address: "Centro Comercial, Valencia",
        process: "DETERMINACION",
        contract_type: "SPECIAL",
        status: true,
        fase: "FASE_2",
        notified: true,
        culminated: true,
        emition_date: "2024-02-10",
        iva: 380000,
        islr: 220000,
        multas: 15000,
        totalRecaudado: 615000,
    },
    {
        id: "tp-003",
        name: "Industrias DEF C.A.",
        rif: "J-11223344-5",
        providenceNum: 2024003,
        address: "Zona Industrial, Maracay",
        process: "VERIFICACION",
        contract_type: "ORDINARY",
        status: true,
        fase: "FASE_1",
        notified: false,
        culminated: false,
        emition_date: "2024-03-05",
        iva: 320000,
        islr: 180000,
        multas: 25000,
        totalRecaudado: 525000,
    },
    {
        id: "tp-004",
        name: "Comercial GHI S.A.",
        rif: "J-55667788-1",
        providenceNum: 2024004,
        address: "Centro Ciudad, Barquisimeto",
        process: "FISCALIZACION",
        contract_type: "ORDINARY",
        status: false,
        fase: "FASE_3",
        notified: true,
        culminated: false,
        emition_date: "2024-01-20",
        iva: 280000,
        islr: 150000,
        multas: 45000,
        totalRecaudado: 475000,
    },
    {
        id: "tp-005",
        name: "Servicios JKL C.A.",
        rif: "J-99887766-3",
        providenceNum: 2024005,
        address: "Av. Principal, Maracaibo",
        process: "DETERMINACION",
        contract_type: "SPECIAL",
        status: true,
        fase: "FASE_2",
        notified: true,
        culminated: true,
        emition_date: "2024-02-28",
        iva: 250000,
        islr: 120000,
        multas: 30000,
        totalRecaudado: 400000,
    },
    {
        id: "tp-006",
        name: "Tecnología MNO S.A.",
        rif: "J-44556677-8",
        providenceNum: 2024006,
        address: "Parque Tecnológico, Caracas",
        process: "VERIFICACION",
        contract_type: "ORDINARY",
        status: true,
        fase: "FASE_1",
        notified: false,
        culminated: false,
        emition_date: "2024-03-15",
        iva: 200000,
        islr: 100000,
        multas: 10000,
        totalRecaudado: 310000,
    },
    {
        id: "tp-007",
        name: "Construcción PQR C.A.",
        rif: "J-33445566-2",
        providenceNum: 2024007,
        address: "Sector Industrial, Valencia",
        process: "FISCALIZACION",
        contract_type: "ORDINARY",
        status: true,
        fase: "FASE_3",
        notified: true,
        culminated: false,
        emition_date: "2024-01-08",
        iva: 180000,
        islr: 90000,
        multas: 20000,
        totalRecaudado: 290000,
    },
    {
        id: "tp-008",
        name: "Alimentos STU S.A.",
        rif: "J-22334455-6",
        providenceNum: 2024008,
        address: "Zona Comercial, Barquisimeto",
        process: "DETERMINACION",
        contract_type: "SPECIAL",
        status: true,
        fase: "FASE_2",
        notified: true,
        culminated: true,
        emition_date: "2024-02-14",
        iva: 160000,
        islr: 80000,
        multas: 35000,
        totalRecaudado: 275000,
    },
]

function TaxpayerList() {

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-VE", {
            style: "currency",
            currency: "VES",
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("es-VE")
    }

    const getFaseColor = (fase: string) => {
        switch (fase) {
            case "FASE_1":
                return "bg-red-600"
            case "FASE_2":
                return "bg-yellow-600"
            case "FASE_3":
                return "bg-green-600"
            default:
                return "bg-gray-600"
        }
    }


    const downloadPDF = (tableId: string, fileName: string) => {
        const element = document.getElementById(tableId)
        if (element) {
            const printWindow = window.open("", "_blank")
            if (printWindow) {
                const tableContent = element.innerHTML
                printWindow.document.write(`
        <html>
          <head>
            <title>${fileName}</title>
            <style>
              @page { size: A4; margin: 0.5in; }
              body { 
                font-family: Arial, sans-serif; 
                margin: 0; 
                background: white; 
                color: black; 
                font-size: 12px;
              }
              .header { 
                margin-bottom: 20px; 
                font-size: 18px; 
                font-weight: bold; 
                text-align: center;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
              }
              .fiscal-info {
                margin-bottom: 15px;
                padding: 10px;
                background: #f5f5f5;
                border-radius: 5px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 10px;
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
                font-size: 10px;
              }
              th { 
                background-color: #f2f2f2; 
                font-weight: bold;
              }
              .space-y-2 > * + * { margin-top: 0.5rem; }
              .grid { display: grid; }
              .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
              .gap-2 { gap: 0.5rem; }
              .p-3 { padding: 0.75rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .font-medium { font-weight: 500; }
              .font-bold { font-weight: 700; }
              .text-sm { font-size: 0.875rem; }
              .text-xs { font-size: 0.75rem; }
              .badge { 
                display: inline-block; 
                padding: 2px 6px; 
                border-radius: 3px; 
                font-size: 10px; 
                font-weight: bold;
              }
              .badge-blue { background: #3b82f6; color: white; }
              .badge-green { background: #10b981; color: white; }
              .badge-yellow { background: #f59e0b; color: white; }
              .badge-red { background: #ef4444; color: white; }
              .badge-gray { background: #6b7280; color: white; }
            </style>
          </head>
          <body>
            <div class="header">${fileName.replace(".pdf", "").replace(/-/g, " ").toUpperCase()}</div>
            <div class="fiscal-info">
              <strong>Fiscal:</strong> ${fiscalInfo.name} | 
              <strong>ID:</strong> ${fiscalInfo.id} | 
              <strong>Total Contribuyentes:</strong> ${fiscalInfo.totalTaxpayers}
            </div>
            ${tableContent}
          </body>
        </html>
      `)
                printWindow.document.close()
                printWindow.print()
            }
        }
    }


    return (
        <>
            <div className="bg-[#2a2a29] border-[#3a3a39] text-white rounded-xl">
                <div className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2 text-base font-semibold lg:pl-4 lg:pt-4">
                        <Building className="w-4 h-4 text-blue-500" />
                        Contribuyentes Asignados
                    </div>
                    <div className="lg:pt-4 lg:pr-4">
                        <button
                            onClick={() => downloadPDF("contribuyentes-table", "contribuyentes-asignados.pdf")}
                            className="px-2 text-white bg-blue-600 border-blue-600 hover:bg-blue-700 h-7"
                        >
                            <Download className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="pt-0">
                    <div id="contribuyentes-table" className="h-[280px] overflow-y-auto custom-scroll lg:p-4">
                        <div className="space-y-2">
                            {taxpayersData.map((taxpayer, index) => (
                                <div key={taxpayer.id} className="border border-[#3a3a39] bg-[#1a1a19] rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{taxpayer.name}</div>
                                                <div className="text-xs text-gray-400">{taxpayer.rif}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-green-400">
                                                {formatCurrency(taxpayer.totalRecaudado)}
                                            </div>
                                            <div className="text-xs text-gray-400">Total</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <p className={`${getFaseColor(taxpayer.fase)} text-white text-xs rounded-full px-2`}>{taxpayer.fase}</p>
                                        {taxpayer.culminated && <p className="px-2 text-xs text-white bg-green-600 rounded-full">CULMINADO</p>}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">IVA</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(taxpayer.iva)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">ISLR</div>
                                            <div className="font-bold text-[10px]">{formatCurrency(taxpayer.islr)}</div>
                                        </div>
                                        <div className="bg-[#2a2a29] rounded-md p-2">
                                            <div className="mb-1 text-gray-400">Multas</div>
                                            <div className="font-bold text-orange-400 text-[10px]">{formatCurrency(taxpayer.multas)}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                                        <MapPin className="w-3 h-3" />
                                        <span>{taxpayer.address}</span>
                                        <Calendar className="w-3 h-3 ml-2" />
                                        <span>{formatDate(taxpayer.emition_date)}</span>
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

export default TaxpayerList