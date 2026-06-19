import apiConnection from '@/components/utils/api/api-connection';

export interface KnowledgeDocumentRow {
    id: string;
    title: string;
    type: string;
    source: string | null;
    version: string;
    status: string;
    effectiveDate: string | null;
    createdAt: string;
    updatedAt: string;
    _count: { chunks: number };
}

export async function listAiKnowledgeDocuments(status = 'published') {
    const { data } = await apiConnection.get<{ success: boolean; documents: KnowledgeDocumentRow[] }>(
        '/ai/knowledge/documents',
        { params: { status } },
    );
    return data.documents;
}

export async function uploadAiKnowledgeDocument(form: FormData) {
    const { data } = await apiConnection.post<{
        success: boolean;
        documentId: string;
        chunkCount: number;
    }>('/ai/knowledge/documents', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

export async function archiveAiKnowledgeDocument(documentId: string) {
    const { data } = await apiConnection.post<{ success: boolean }>(
        `/ai/knowledge/documents/${documentId}/archive`,
    );
    return data;
}
