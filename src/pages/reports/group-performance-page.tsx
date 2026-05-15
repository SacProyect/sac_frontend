import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { getMonthlyCollection, getCoordinationGroups } from "@/components/utils/api/report-functions";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { TrendingUp, DollarSign, Calendar, Filter, ArrowDown, Loader2, RefreshCw } from "lucide-react";

// Month names in Spanish
const MONTHS = [
	{ value: "", label: "Todos" },
	{ value: "01", label: "Enero" },
	{ value: "02", label: "Febrero" },
	{ value: "03", label: "Marzo" },
	{ value: "04", label: "Abril" },
	{ value: "05", label: "Mayo" },
	{ value: "06", label: "Junio" },
	{ value: "07", label: "Julio" },
	{ value: "08", label: "Agosto" },
	{ value: "09", label: "Septiembre" },
	{ value: "10", label: "Octubre" },
	{ value: "11", label: "Noviembre" },
	{ value: "12", label: "Diciembre" },
];

// Format as currency
const formatCurrency = (value: number) => {
	return new Intl.NumberFormat("es-VE", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
};

// Format compact numbers
const formatCompact = (value: number) => {
	if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
	if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
	return formatCurrency(value);
};

interface MonthlyCollection {
	month: string;
	finesCollected: number;
	ivaCollected: number;
	islrCollected: number;
	totalCollected: number;
}

interface CoordinationGroup {
	id: string;
	name: string;
}

function GroupPerformancePage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const yearParam = searchParams.get("date") || String(new Date().getFullYear());
	const groupIdParam = searchParams.get("groupId") || "";

	const [data, setData] = useState<MonthlyCollection[]>([]);
	const [groups, setGroups] = useState<CoordinationGroup[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedMonth, setSelectedMonth] = useState("");
	const [selectedGroup, setSelectedGroup] = useState(groupIdParam);

	const year = parseInt(yearParam, 10);

	// Fetch data on mount or when year/group changes
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const result = await getMonthlyCollection(year, selectedGroup || undefined, selectedMonth ? parseInt(selectedMonth, 10) : undefined);
				setData(result || []);
			} catch (err) {
				console.error("Error fetching monthly collection:", err);
				setError("No se pudo cargar la información de recaudación mensual");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [year, selectedGroup, selectedMonth]);

	// Fetch coordination groups
	useEffect(() => {
		const fetchGroups = async () => {
			try {
				const result = await getCoordinationGroups();
				setGroups(result || []);
			} catch (err) {
				console.error("Error fetching groups:", err);
			}
		};
		fetchGroups();
	}, []);

	// Filter data based on selected month
	const filteredData = useMemo(() => {
		if (!selectedMonth) return data;
		return data.filter((item) => item.month.endsWith(`-${selectedMonth}`));
	}, [data, selectedMonth]);

	// Calculate totals
	const totals = useMemo(() => {
		return data.reduce(
			(acc, item) => ({
				finesCollected: acc.finesCollected + (item.finesCollected || 0),
				ivaCollected: acc.ivaCollected + (item.ivaCollected || 0),
				islrCollected: acc.islrCollected + (item.islrCollected || 0),
				totalCollected: acc.totalCollected + (item.totalCollected || 0),
			}),
			{ finesCollected: 0, ivaCollected: 0, islrCollected: 0, totalCollected: 0 }
		);
	}, [data]);

	// Get month name from month string (e.g., "2024-01" -> "Enero")
	const getMonthName = (monthStr: string) => {
		const monthNum = parseInt(monthStr.split("-")[1], 10);
		return MONTHS[monthNum]?.label || monthStr;
	};

	// Prepare chart data
	const chartData = useMemo(() => {
		return data.map((item) => ({
			month: getMonthName(item.month),
			finesCollected: item.finesCollected || 0,
			ivaCollected: item.ivaCollected || 0,
			islrCollected: item.islrCollected || 0,
			totalCollected: item.totalCollected || 0,
			rawMonth: item.month,
		}));
	}, [data]);

	// Handle month filter change
	const handleMonthChange = (month: string) => {
		setSelectedMonth(month);
	};

	// Handle group filter change
	const handleGroupChange = (groupId: string) => {
		setSelectedGroup(groupId);
		setSearchParams((prev) => {
			if (groupId) {
				prev.set("groupId", groupId);
			} else {
				prev.delete("groupId");
			}
			return prev;
		});
	};

	// Find selected month data for detail card
	const selectedMonthData = useMemo(() => {
		if (!selectedMonth) return null;
		return data.find((item) => item.month.endsWith(`-${selectedMonth}`));
	}, [data, selectedMonth]);

	// Custom tooltip for chart
	const CustomTooltip = ({ active, payload }: any) => {
		if (active && payload && payload.length) {
			const d = payload[0].payload;
			return (
				<div className="bg-slate-900/95 border border-slate-700/40 rounded-xl p-4 text-xs shadow-2xl backdrop-blur-sm min-w-[220px]">
					<div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-700/30">
						<p className="font-bold text-slate-200 uppercase tracking-widest text-[10px]">
							{d.month}
						</p>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Multas Cobradas</span>
							<span className="text-amber-400 font-bold">{formatCompact(d.finesCollected)}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">IVA Cobrado</span>
							<span className="text-blue-400 font-bold">{formatCompact(d.ivaCollected)}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">ISLR Cobrado</span>
							<span className="text-purple-400 font-bold">{formatCompact(d.islrCollected)}</span>
						</div>
						<div className="pt-2 border-t border-slate-700/30 mt-2">
							<div className="flex items-center justify-between">
								<span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Total Cobrado</span>
								<span className="text-emerald-400 font-black text-lg">{formatCompact(d.totalCollected)}</span>
							</div>
						</div>
					</div>
				</div>
			);
		}
		return null;
	};

	// Loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="w-10 h-10 animate-spin text-blue-500" />
					<p className="text-slate-400 text-sm">Cargando datos de recaudación...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="flex flex-col items-center gap-4 text-center">
					<div className="p-4 bg-red-500/10 border border-red-500/30 rounded-full">
						<TrendingUp className="w-8 h-8 text-red-400" />
					</div>
					<p className="text-red-400 font-medium">{error}</p>
					<button
						onClick={() => window.location.reload()}
						className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
					>
						<RefreshCw className="w-4 h-4" />
						Reintentar
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-slate-950 text-slate-200 p-4 lg:p-6">
			{/* Header */}
			<div className="mb-6">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
					<div>
						<h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
							<TrendingUp className="w-7 h-7 text-emerald-400" />
							Rendimiento de Recaudación
						</h1>
						<p className="text-slate-400 mt-1">Análisis mensual de la recaudación por grupo de coordinación</p>
					</div>
					<div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
						<DollarSign className="w-5 h-5 text-emerald-400" />
						<div className="flex flex-col">
							<span className="text-[10px] text-emerald-400/70 uppercase font-bold tracking-wider">Total Año {year}</span>
							<span className="text-xl lg:text-2xl font-black text-emerald-400">{formatCompact(totals.totalCollected)}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Filters */}
			<div className="flex flex-col lg:flex-row gap-4 mb-6">
				{/* Month Filter */}
				<div className="flex-1 lg:max-w-xs">
					<label className="block text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">
						<Calendar className="w-3 h-3 inline mr-1" />
						Filtrar por Mes
					</label>
					<select
						value={selectedMonth}
						onChange={(e) => handleMonthChange(e.target.value)}
						className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
					>
						{MONTHS.map((month) => (
							<option key={month.value} value={month.value}>
								{month.label}
							</option>
						))}
					</select>
				</div>

				{/* Group Filter */}
				<div className="flex-1 lg:max-w-xs">
					<label className="block text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">
						<Filter className="w-3 h-3 inline mr-1" />
						Grupo de Coordinación
					</label>
					<select
						value={selectedGroup}
						onChange={(e) => handleGroupChange(e.target.value)}
						className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700/50 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
					>
						<option value="">Todos los grupos</option>
						{groups.map((group) => (
							<option key={group.id} value={group.id}>
								{group.name}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Detail Card for Selected Month */}
			{selectedMonthData && (
				<div className="mb-6 p-4 bg-slate-900/50 border border-slate-700/30 rounded-xl">
					<h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
						<Calendar className="w-4 h-4 text-blue-400" />
						Detalle de {getMonthName(selectedMonthData.month)}
					</h3>
					<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
							<p className="text-[10px] text-amber-400/70 uppercase font-bold tracking-wider mb-1">Multas Cobradas</p>
							<p className="text-lg font-black text-amber-400">{formatCurrency(selectedMonthData.finesCollected)}</p>
						</div>
						<div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
							<p className="text-[10px] text-blue-400/70 uppercase font-bold tracking-wider mb-1">IVA Cobrado</p>
							<p className="text-lg font-black text-blue-400">{formatCurrency(selectedMonthData.ivaCollected)}</p>
						</div>
						<div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
							<p className="text-[10px] text-purple-400/70 uppercase font-bold tracking-wider mb-1">ISLR Cobrado</p>
							<p className="text-lg font-black text-purple-400">{formatCurrency(selectedMonthData.islrCollected)}</p>
						</div>
						<div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
							<p className="text-[10px] text-emerald-400/70 uppercase font-bold tracking-wider mb-1">Total Cobrado</p>
							<p className="text-lg font-black text-emerald-400">{formatCurrency(selectedMonthData.totalCollected)}</p>
						</div>
					</div>
				</div>
			)}

			{/* Chart */}
			<div className="mb-6 p-4 bg-slate-900/30 border border-slate-700/30 rounded-xl">
				<h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
					<TrendingUp className="w-4 h-4 text-blue-400" />
					Tendencia Mensual
				</h3>
				<div className="h-[300px] lg:h-[350px]">
					{chartData.length > 0 ? (
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
								<defs>
									<linearGradient id="gradientFines" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
										<stop offset="100%" stopColor="#f59e0b" stopOpacity={0.6} />
									</linearGradient>
									<linearGradient id="gradientIVA" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
										<stop offset="100%" stopColor="#3b82f6" stopOpacity={0.6} />
									</linearGradient>
									<linearGradient id="gradientISLR" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
										<stop offset="100%" stopColor="#a855f7" stopOpacity={0.6} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
								<XAxis
									dataKey="month"
									stroke="#94a3b8"
									tick={{ fontSize: 11, fontWeight: "600", fill: "#94a3b8" }}
									axisLine={{ stroke: "#1e293b" }}
									tickLine={false}
									dy={5}
								/>
								<YAxis
									stroke="#94a3b8"
									tickFormatter={(val) => formatCompact(Number(val))}
									tick={{ fontSize: 10, fill: "#94a3b8" }}
									axisLine={false}
									tickLine={false}
									width={55}
								/>
								<Tooltip cursor={{ fill: "rgba(255, 255, 255, 0.05)" }} content={<CustomTooltip />} />
								<Bar dataKey="finesCollected" name="Multas" fill="url(#gradientFines)" radius={[4, 4, 0, 0]} barSize={14} />
								<Bar dataKey="ivaCollected" name="IVA" fill="url(#gradientIVA)" radius={[4, 4, 0, 0]} barSize={14} />
								<Bar dataKey="islrCollected" name="ISLR" fill="url(#gradientISLR)" radius={[4, 4, 0, 0]} barSize={14} />
							</BarChart>
						</ResponsiveContainer>
					) : (
						<div className="flex items-center justify-center h-full text-slate-500">
							No hay datos disponibles para el período seleccionado
						</div>
					)}
				</div>
				{/* Legend */}
				<div className="flex items-center justify-center gap-6 mt-4 text-xs">
					<div className="flex items-center gap-2 text-slate-300">
						<span className="h-3 w-3 rounded-sm bg-amber-500" />
						<span>Multas Cobradas</span>
					</div>
					<div className="flex items-center gap-2 text-slate-300">
						<span className="h-3 w-3 rounded-sm bg-blue-500" />
						<span>IVA Cobrado</span>
					</div>
					<div className="flex items-center gap-2 text-slate-300">
						<span className="h-3 w-3 rounded-sm bg-purple-500" />
						<span>ISLR Cobrado</span>
					</div>
				</div>
			</div>

			{/* Table */}
			<div className="bg-slate-900/30 border border-slate-700/30 rounded-xl overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-slate-800/50 border-b border-slate-700/30">
								<th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
									Mes
								</th>
								<th className="px-4 py-3 text-right text-xs font-bold text-amber-400 uppercase tracking-wider">
									Multas Cobradas
								</th>
								<th className="px-4 py-3 text-right text-xs font-bold text-blue-400 uppercase tracking-wider">
									IVA Cobrado
								</th>
								<th className="px-4 py-3 text-right text-xs font-bold text-purple-400 uppercase tracking-wider">
									ISLR Cobrado
								</th>
								<th className="px-4 py-3 text-right text-xs font-bold text-emerald-400 uppercase tracking-wider">
									Total Cobrado
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-700/30">
							{filteredData.map((item, index) => {
								const isSelected = selectedMonth && item.month.endsWith(`-${selectedMonth}`);
								return (
									<tr
										key={item.month}
										className={`transition-colors ${
											isSelected
												? "bg-blue-500/10 border-l-2 border-l-blue-500"
												: index % 2 === 0
												? "bg-slate-900/20"
												: "bg-slate-900/40"
										} hover:bg-slate-800/50`}
									>
										<td className="px-4 py-3 font-medium text-slate-200">
											<div className="flex items-center gap-2">
												{isSelected && <ArrowDown className="w-3 h-3 text-blue-400" />}
												{getMonthName(item.month)}
											</div>
										</td>
										<td className="px-4 py-3 text-right text-amber-400 font-medium">
											{formatCurrency(item.finesCollected)}
										</td>
										<td className="px-4 py-3 text-right text-blue-400 font-medium">
											{formatCurrency(item.ivaCollected)}
										</td>
										<td className="px-4 py-3 text-right text-purple-400 font-medium">
											{formatCurrency(item.islrCollected)}
										</td>
										<td className="px-4 py-3 text-right text-emerald-400 font-bold">
											{formatCurrency(item.totalCollected)}
										</td>
									</tr>
								);
							})}
						</tbody>
						<tfoot>
							<tr className="bg-slate-800/60 border-t-2 border-t-slate-700/50">
								<td className="px-4 py-4 font-bold text-slate-200 text-sm">
									Total Año {year}
								</td>
								<td className="px-4 py-4 text-right font-bold text-amber-400">
									{formatCurrency(totals.finesCollected)}
								</td>
								<td className="px-4 py-4 text-right font-bold text-blue-400">
									{formatCurrency(totals.ivaCollected)}
								</td>
								<td className="px-4 py-4 text-right font-bold text-purple-400">
									{formatCurrency(totals.islrCollected)}
								</td>
								<td className="px-4 py-4 text-right font-black text-emerald-400 text-lg">
									{formatCurrency(totals.totalCollected)}
								</td>
							</tr>
						</tfoot>
					</table>
				</div>
			</div>

			{/* Empty state */}
			{!loading && !error && data.length === 0 && (
				<div className="flex flex-col items-center justify-center py-12 text-center">
					<TrendingUp className="w-12 h-12 text-slate-600 mb-4" />
					<p className="text-slate-400 text-lg font-medium">No hay datos disponibles</p>
					<p className="text-slate-500 text-sm mt-1">No se encontró información de recaudación para el período seleccionado</p>
				</div>
			)}
		</div>
	);
}

export default GroupPerformancePage;