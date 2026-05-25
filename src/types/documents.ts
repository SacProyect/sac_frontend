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
  mimeType: string;
  fileSize: number;
  scope: DocumentScope;
  ownerId: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  owner?: UserInfo | null;
  uploadedBy?: UserInfo | null;
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
