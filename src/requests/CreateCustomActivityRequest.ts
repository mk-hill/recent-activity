export interface CreateCustomActivityRequest {
  id?: string;
  date?: string;
  title: string;
  source?: string;
  type?: string;
  description?: string;
  links?: {
    title: Record<string, string>;
    description: Record<string, string>;
  };
}
