import apiConnection from './api-connection';
import { Announcement, AnnouncementType, AnnouncementTargetType } from '@/types/announcements';

export interface CreateAnnouncementData {
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
}

export const getAnnouncements = async () => {
  const resp = await apiConnection.get<{ success: boolean; data: Announcement[] }>('/admin/announcements');
  return resp.data.data;
};

export const createAnnouncement = async (data: CreateAnnouncementData) => {
  const resp = await apiConnection.post<{ success: boolean; data: Announcement }>('/admin/announcements', data);
  return resp.data.data;
};

export const updateAnnouncement = async (id: string, data: Partial<CreateAnnouncementData>) => {
  const resp = await apiConnection.put<{ success: boolean; data: Announcement }>(`/admin/announcements/${id}`, data);
  return resp.data.data;
};

export const deleteAnnouncement = async (id: string) => {
  await apiConnection.delete(`/admin/announcements/${id}`);
};
