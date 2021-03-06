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
  links?: {
    title: Record<string, string>;
    description: Record<string, string>;
  };
}
