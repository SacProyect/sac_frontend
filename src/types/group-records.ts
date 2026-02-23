
export interface GroupRecordFiscal {
    name: string;
}

export type GroupRecordProcess = "FP" | "AF" | "VDF";

export interface GroupRecord {
    id: string;
    groupRecordMonthId: string;
    fiscalId: string;
    process: GroupRecordProcess;
    collectedFines: string; // string, but can be parsed to number
    collectedIVA: string;
    collectedISLR: string;
    warnings: number;
    fines: number;
    compromises: number;
    taxpayers: number;
    fiscal: GroupRecordFiscal;
}

export interface GroupRecordsApiResponse {
    groupName: string;
    records: GroupRecord[];
}

export function normalizeGroupRecordsApiResponse(apiResponse: any): GroupRecordsApiResponse {
    // If the first record has 'collectedIVA', it's the "with month" shape
    if (
        apiResponse.records.length > 0 &&
        (typeof apiResponse.records[0].collectedIVA !== "undefined" ||
            typeof apiResponse.records[0].collectedISLR !== "undefined")
    ) {
        // Already in expected format
        return apiResponse as GroupRecordsApiResponse;
    }

    // Otherwise, it's the "without month" shape, so map fields
    return {
        groupName: apiResponse.groupName,
        records: apiResponse.records.map((rec: any) => ({
            id: rec.fiscalId, // Use fiscalId as id (no id in this shape)
            groupRecordMonthId: "", // Not available
            fiscalId: rec.fiscalId,
            process: rec.process,
            collectedFines: rec.collectedFines.toString(),
            collectedIVA: rec.collectedIva?.toString() ?? "0",
            collectedISLR: rec.collectedIslr?.toString() ?? "0",
            warnings: rec.totalWarnings ?? 0,
            fines: rec.totalFines ?? 0,
            compromises: rec.totalCompromises ?? 0,
            taxpayers: rec.totalTaxpayers ?? 0,
            fiscal: rec.fiscal,
        })),
    };
}