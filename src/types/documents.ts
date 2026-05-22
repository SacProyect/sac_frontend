export type DocumentScope = "PRIVATE" | "MANAGEMENT" | "SENT_TO_BOSS";

export type DocumentTab = "mine" | "management" | "sentToBoss";

export interface UserInfo {
  id: string;
  name: string;
  group?: { id: string; name: string } | null;
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
  recipientId: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: UserInfo | null;
  uploadedBy?: UserInfo | null;
  recipient?: UserInfo | null;
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
