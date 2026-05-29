import apiConnection from "./api-connection";
import { Announcement } from "@/types/announcements";

export const getPendingAnnouncements = async () => {
  const resp = await apiConnection.get<{ success: boolean; data: Announcement[] }>("/announcements/pending");
  return resp.data.data;
};

export const markAsOpened = async (id: string) => {
  await apiConnection.post(`/announcements/${id}/open`);
};

export const markAsClosed = async (id: string, timeSpentSeconds?: number) => {
  await apiConnection.post(`/announcements/${id}/close`, { timeSpentSeconds });
};

export const markCtaClicked = async (id: string) => {
  await apiConnection.post(`/announcements/${id}/cta-click`);
};

export const confirmCriticalAnnouncement = async (id: string) => {
  await apiConnection.post(`/announcements/${id}/confirm`, { confirmed: true });
};
