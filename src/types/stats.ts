

export interface GroupData {
    name: string;
    best: string;
    worse: string;
    supervisors: Supervisor[];
}

export interface Supervisor {
    name: string;
    collectedIva: string;
    collectedIslr: string;
    collectedFines: string;
    total: string;
}

export interface TopFiscals {
    name: string;
    collectedIva: string;
    collectedIslr: string;
    collectedFines: string;
    total: string;
}

export interface TopFiveFiscalsByGroup {
    name: string;
    fiscals: { name: string; total: number }[];
    totalCollected: number;
}

export interface BestGrowth {
    groupName: string;
    antePreviousMonth: string;
    previousMonth: string;
    growthPercentage: number;
    coordinatorName: string;
    compliancePercentage: number;
    currentMonth: number;
}

export interface ComplianceData {
    high: High[];
    medium: High[];
    low: High[];
    // ✅ Campos opcionales (Backend nuevo) para gráficos sin recalcular
    highComplianceCount?: number;
    mediumComplianceCount?: number;
    lowComplianceCount?: number;
    totalTaxpayers?: number;
}

export interface High {
    name: string;
    rif: string;
    compliance: number;
    totalIVA: string;
    totalISLR: string;
    totalFines: string;
    totalCollected: string;
}

export interface ExpectedGoal {
    totalReports: number;
    totalExpected: number;
    totalPaid: number;
    difference: number;
    percentage: number;
    status: string;
    compliance: number;
}
