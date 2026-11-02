import { isValidRequestDate } from "@/lib/request-date-access";

export type Announcement = {
  id: string;
  title: string;
  message: string;
  closure_date: string | null;
  created_at: string;
};

export function validateAnnouncement(input: { title: string; message: string; closureDate: string }) {
  if (!input || typeof input.title !== "string" || typeof input.message !== "string" || typeof input.closureDate !== "string") return null;
  const title = input.title.trim();
  const message = input.message.trim();
  if (!title || title.length > 100 || !message || message.length > 2000) return null;
  if (input.closureDate && !isValidRequestDate(input.closureDate)) return null;
  return { title, message, closure_date: input.closureDate || null };
}
