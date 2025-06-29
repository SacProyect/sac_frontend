

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
    previousMonth: string;
    currentMonth: string;
    growthPercentage: number;
    coordinatorName: string;
}