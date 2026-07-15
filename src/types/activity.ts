export type ActivityType =
  | "enquiry"
  | "route"
  | "airline"
  | "airport"
  | "destination"
  | "hotel"
  | "visa"
  | "banner";

export type RecentActivity = {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  href: string;
  created_at: string;
  status?: string;
};
