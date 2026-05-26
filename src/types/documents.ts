export type DocumentScope = "PRIVATE" | "SHARED";

export type DocumentTab = "mine" | "shared" | "all";

export interface UserInfo {
  id: string;
  name: string;
  group?: { id: string; name: string } | null;
}

export interface FiscalGroupInfo {
  id: string;
  name: string;
  coordinatorId?: string;
}

export interface SharedWithInfo {
  fiscalGroup: FiscalGroupInfo;
  createdAt: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string; description?: string; categoryId?: string; isSensitive?: boolean; category?: DocumentCategoryInfo;
  fileSize: number;
  scope: DocumentScope;
  ownerId: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  owner?: UserInfo | null;
  uploadedBy?: UserInfo | null; accessRecords?: DocumentAccessItem[];
  sharedWith?: SharedWithInfo[];
}

export interface ListDocumentsResponse {
  success: boolean;
  items: DocumentItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DocumentDetailResponse {
  success: boolean;
  data: DocumentItem;
}

export interface DownloadResponse {
  success: boolean;
  data: { url: string };
}

export interface FiscalGroupListResponse {
  success: boolean;
  data: FiscalGroupInfo[];
}
`nexport interface AdminUnitInfo {`n  id: string;`n  name: string;`n}`n`nexport interface AdminUnitListResponse {`n  success: boolean;`n  data: AdminUnitInfo[];`n}
`nexport interface DocumentAccessItem {`n  id: string;`n  principalType: \"USER\" | \"FISCAL_GROUP\" | \"ROLE\" | \"ADMIN_UNIT\";`n  principalId: string;`n  permission: \"VIEW\" | \"MANAGE\";`n  createdAt: string;`n  expiresAt: string | null;`n}
`nexport interface DocumentCategoryInfo {`n  id: string;`n  name: string;`n  slug: string;`n}`n`nexport interface DocumentCategoryListResponse {`n  success: boolean;`n  data: DocumentCategoryInfo[];`n}
