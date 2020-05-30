export interface Activity {
  partition?: string;
  activityId?: string;
  source: string;
  type?: string;
  title: string;
  description?: string;
  performedAt?: string;
  savedAt?: string;
  date?: Date;
}
