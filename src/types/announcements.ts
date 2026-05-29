export type AnnouncementType = 'TOP_BAR' | 'MODAL' | 'TOOLTIP';

export type AnnouncementTargetType = 'GLOBAL' | 'ROLE' | 'COORDINACION' | 'SPECIFIC_USER';

export interface Announcement {
  id: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'gif' | 'video';
  type: AnnouncementType;
  targetSection?: string;
  ctaText?: string;
  ctaUrl?: string;
  isCritical: boolean;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  targetType: AnnouncementTargetType;
  targetRole?: string;
  targetCoordinacionId?: string;
  specificUserId?: string;
  version?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementRead {
  id: string;
  userId: string;
  announcementId: string;
  openedAt: string;
  closedAt?: string;
  ctaClickedAt?: string;
  timeSpentSeconds?: number;
  isConfirmed: boolean;
}

export interface AnnouncementReader {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  openedAt: string;
  closedAt?: string;
  ctaClickedAt?: string;
  timeSpentSeconds?: number;
  isConfirmed: boolean;
}
